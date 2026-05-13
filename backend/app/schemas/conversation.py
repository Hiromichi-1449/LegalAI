import uuid
from datetime import datetime
from pydantic import BaseModel
from app.db.models import MessageRole


class ConversationCreate(BaseModel):
    client_id: uuid.UUID
    title: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: MessageRole
    content: str
    model_used: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: uuid.UUID
    firm_id: uuid.UUID
    user_id: uuid.UUID
    client_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationWithMessages(ConversationResponse):
    messages: list[MessageResponse] = []
