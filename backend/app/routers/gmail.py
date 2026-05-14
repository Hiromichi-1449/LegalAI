import uuid
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select

from app.dependencies import CurrentUser, DB
from app.db.models import User
from app.services import gmail_service
from app.config import settings

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
    db: DB = None,
):
    """OAuth callback from Google — exchange code for tokens.
    The state parameter carries the user_id set in /auth-url.
    No auth header here because this is a browser redirect from Google.
    """
    user_id = uuid.UUID(state)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    await gmail_service.handle_callback(db, user, code)

    # Redirect back to the app's email panel after successful connection
    return RedirectResponse(url=f"{settings.frontend_url}/chat?gmail=connected")


@router.post("/sync")
async def sync_gmail(current_user: CurrentUser, db: DB):
    """Pull latest inbox emails from Gmail into the DB."""
    new_count = await gmail_service.sync_inbox(db, current_user)
    return {"new_emails": new_count}
