import uuid
from pydantic import BaseModel


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    preferred_model: str
    gmail_address: str | None
    firm_id: uuid.UUID

    model_config = {"from_attributes": True}


class UpdateUserRequest(BaseModel):
    preferred_model: str | None = None
    full_name: str | None = None
