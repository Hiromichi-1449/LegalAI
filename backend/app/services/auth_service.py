import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, Firm
from app.core.security import decode_auth0_token


async def register_or_login(
    db: AsyncSession,
    token: str,
    firm_name: str | None,
) -> tuple[User, Firm, bool]:
    """
    Upsert a user on first Auth0 login.
    - If no firm_name: user must be joining an existing firm (not yet supported — returns error).
    - If firm_name provided: create a new firm + user.
    Returns (user, firm, is_new_firm).
    """
    payload = await decode_auth0_token(token)
    auth0_sub = payload["sub"]
    email = payload.get("email", "")
    full_name = payload.get("name", email)

    # Check if user already exists
    result = await db.execute(select(User).where(User.auth0_sub == auth0_sub))
    existing = result.scalar_one_or_none()
    if existing:
        firm_result = await db.execute(select(Firm).where(Firm.id == existing.firm_id))
        firm = firm_result.scalar_one()
        return existing, firm, False

    # New user — require firm_name to create a firm
    if not firm_name:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="firm_name required for new user registration")

    firm = Firm(name=firm_name)
    db.add(firm)
    await db.flush()  # get firm.id

    user = User(
        auth0_sub=auth0_sub,
        firm_id=firm.id,
        email=email,
        full_name=full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(firm)
    return user, firm, True
