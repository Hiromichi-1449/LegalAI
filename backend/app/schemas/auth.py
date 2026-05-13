from pydantic import BaseModel


class RegisterRequest(BaseModel):
    firm_name: str | None = None  # provided only when creating a new firm


class RegisterResponse(BaseModel):
    user_id: str
    firm_id: str
    is_new_firm: bool
