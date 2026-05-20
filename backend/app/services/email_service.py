import uuid
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Email, EmailDirection, EmailStatus, User
from app.config import settings
from app.services import splunk_service

sg = SendGridAPIClient(api_key=settings.sendgrid_api_key)


async def send_email(
    db: AsyncSession,
    user: User,
    to_address: str,
    subject: str,
    body: str,
    client_id: uuid.UUID | None = None,
) -> Email:
    message = Mail(
        from_email=settings.sendgrid_from_email,
        to_emails=to_address,
        subject=subject,
        plain_text_content=body,
    )

    base_event = {
        "firm_id": str(user.firm_id),
        "user_id": str(user.id),
        "client_id": str(client_id) if client_id else None,
    }

    try:
        response = sg.send(message)
        sendgrid_message_id = response.headers.get("X-Message-Id")
    except Exception as exc:
        splunk_service.emit({
            "event_type": "email.send_failed",
            "error_category": type(exc).__name__,
            **base_event,
        })
        raise

    email = Email(
        firm_id=user.firm_id,
        user_id=user.id,
        client_id=client_id,
        direction=EmailDirection.outbound,
        status=EmailStatus.sent,
        from_address=settings.sendgrid_from_email,
        to_address=to_address,
        subject=subject,
        body=body,
        sendgrid_message_id=sendgrid_message_id,
        is_read=True,
    )
    db.add(email)
    await db.commit()
    await db.refresh(email)

    splunk_service.emit({"event_type": "email.sent", **base_event})

    return email


async def save_draft(
    db: AsyncSession,
    user: User,
    to_address: str,
    subject: str,
    body: str,
    client_id: uuid.UUID | None = None,
) -> Email:
    email = Email(
        firm_id=user.firm_id,
        user_id=user.id,
        client_id=client_id,
        direction=EmailDirection.outbound,
        status=EmailStatus.draft,
        from_address=settings.sendgrid_from_email,
        to_address=to_address,
        subject=subject,
        body=body,
        is_read=True,
    )
    db.add(email)
    await db.commit()
    await db.refresh(email)
    return email


async def list_emails(
    db: AsyncSession,
    user: User,
    status: EmailStatus | None = None,
) -> list[Email]:
    query = select(Email).where(Email.user_id == user.id)
    if status:
        query = query.where(Email.status == status)
    query = query.order_by(Email.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())
