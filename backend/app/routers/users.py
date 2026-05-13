from fastapi import APIRouter
from app.dependencies import CurrentUser, DB
from app.schemas.user import UserResponse, UpdateUserRequest

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(body: UpdateUserRequest, current_user: CurrentUser, db: DB):
    if body.preferred_model is not None:
        current_user.preferred_model = body.preferred_model
    if body.full_name is not None:
        current_user.full_name = body.full_name
    await db.commit()
    await db.refresh(current_user)
    return current_user
