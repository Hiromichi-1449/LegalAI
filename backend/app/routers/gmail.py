import uuid
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from app.dependencies import CurrentUser, DB
from app.services import gmail_service

router = APIRouter()


@router.get("/auth-url")
async def get_auth_url(current_user: CurrentUser):
    """Return the Gmail OAuth consent URL. Frontend redirects the user here."""
    state = str(current_user.id)
    url = gmail_service.get_auth_url(state=state)
    return {"auth_url": url}


@router.get("/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...),
    current_user: CurrentUser = None,
    db: DB = None,
):
    """OAuth callback — exchange code for tokens and store them."""
    await gmail_service.handle_callback(db, current_user, code)
    return {"detail": "Gmail connected successfully"}


@router.post("/sync")
async def sync_gmail(current_user: CurrentUser, db: DB):
    """Pull latest inbox emails from Gmail into the DB."""
    new_count = await gmail_service.sync_inbox(db, current_user)
    return {"new_emails": new_count}
