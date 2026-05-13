from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.dependencies import DB
from app.schemas.auth import RegisterRequest, RegisterResponse
from app.services import auth_service

router = APIRouter()
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=RegisterResponse)
async def register(
    body: RegisterRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: DB = None,
):
    """Called once after Auth0 login to provision user + firm."""
    user, firm, is_new_firm = await auth_service.register_or_login(
        db, credentials.credentials, body.firm_name
    )
    return RegisterResponse(
        user_id=str(user.id),
        firm_id=str(firm.id),
        is_new_firm=is_new_firm,
    )
