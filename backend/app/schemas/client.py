import uuid
from datetime import datetime
from pydantic import BaseModel


class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None


class ClientResponse(BaseModel):
    id: uuid.UUID
    firm_id: uuid.UUID
    first_name: str
    last_name: str
    email: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
