import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import base64
import email as email_lib

from app.db.models import Email, EmailToken, EmailDirection, EmailStatus, User
from app.config import settings

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]

CLIENT_CONFIG = {
    "web": {
        "client_id":     settings.gmail_client_id,
        "client_secret": settings.gmail_client_secret,
        "redirect_uris": [settings.gmail_redirect_uri],
        "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
        "token_uri":     "https://oauth2.googleapis.com/token",
    }
}


def get_auth_url(state: str) -> str:
    flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
    flow.redirect_uri = settings.gmail_redirect_uri
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=state,
        prompt="consent",
    )
    return auth_url


async def handle_callback(
    db: AsyncSession,
    user: User,
    code: str,
) -> EmailToken:
    flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
    flow.redirect_uri = settings.gmail_redirect_uri
    flow.fetch_token(code=code)
    credentials = flow.credentials

    result = await db.execute(select(EmailToken).where(EmailToken.user_id == user.id))
    token_row = result.scalar_one_or_none()

    expiry = credentials.expiry or datetime.now(timezone.utc)

    if token_row:
        token_row.access_token  = credentials.token
        token_row.refresh_token = credentials.refresh_token or token_row.refresh_token
        token_row.token_expiry  = expiry
    else:
        token_row = EmailToken(
            user_id=user.id,
            firm_id=user.firm_id,
            access_token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_expiry=expiry,
        )
        db.add(token_row)

    # Store gmail address on user
    gmail_service = build("gmail", "v1", credentials=credentials)
    profile = gmail_service.users().getProfile(userId="me").execute()
    user.gmail_address = profile.get("emailAddress")

    await db.commit()
    await db.refresh(token_row)
    return token_row


async def sync_inbox(db: AsyncSession, user: User) -> int:
    """Pull recent Gmail messages and store new ones. Returns count of new emails."""
    result = await db.execute(select(EmailToken).where(EmailToken.user_id == user.id))
    token_row = result.scalar_one_or_none()
    if not token_row:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Gmail not connected. Call /gmail/auth-url first.")

    credentials = Credentials(
        token=token_row.access_token,
        refresh_token=token_row.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.gmail_client_id,
        client_secret=settings.gmail_client_secret,
        expiry=token_row.token_expiry,
    )

    gmail_service = build("gmail", "v1", credentials=credentials)
    messages_result = gmail_service.users().messages().list(
        userId="me", maxResults=50, labelIds=["INBOX"]
    ).execute()
    message_ids = [m["id"] for m in messages_result.get("messages", [])]

    new_count = 0
    for msg_id in message_ids:
        # Skip already-synced messages
        existing = await db.execute(
            select(Email).where(Email.gmail_message_id == msg_id)
        )
        if existing.scalar_one_or_none():
            continue

        msg = gmail_service.users().messages().get(
            userId="me", id=msg_id, format="full"
        ).execute()

        headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}
        subject      = headers.get("Subject", "(no subject)")
        from_address = headers.get("From", "")
        to_address   = headers.get("To", user.gmail_address or "")
        date_str     = headers.get("Date", "")

        # Extract plain text body
        body = _extract_body(msg["payload"])

        received_at = None
        try:
            from email.utils import parsedate_to_datetime
            received_at = parsedate_to_datetime(date_str)
        except Exception:
            received_at = datetime.now(timezone.utc)

        email_obj = Email(
            firm_id=user.firm_id,
            user_id=user.id,
            direction=EmailDirection.inbound,
            status=EmailStatus.received,
            from_address=from_address,
            to_address=to_address,
            subject=subject,
            body=body,
            gmail_message_id=msg_id,
            is_read=False,
            received_at=received_at,
        )
        db.add(email_obj)
        new_count += 1

    await db.commit()
    return new_count


def _extract_body(payload: dict) -> str:
    """Recursively extract plain text from a Gmail message payload."""
    if payload.get("mimeType") == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")

    for part in payload.get("parts", []):
        result = _extract_body(part)
        if result:
            return result

    return ""
