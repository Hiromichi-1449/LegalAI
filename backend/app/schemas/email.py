import uuid
from datetime import datetime
from pydantic import BaseModel
from app.db.models import EmailDirection, EmailStatus


class EmailSendRequest(BaseModel):
    to_address: str
    subject: str
    body: str
    client_id: uuid.UUID | None = None


class EmailDraftRequest(BaseModel):
    to_address: str
    subject: str
    body: str
    client_id: uuid.UUID | None = None


class EmailResponse(BaseModel):
    id: uuid.UUID
    direction: EmailDirection
    status: EmailStatus
    from_address: str
    to_address: str
    subject: str
    body: str
    is_read: bool
    client_id: uuid.UUID | None
    received_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
