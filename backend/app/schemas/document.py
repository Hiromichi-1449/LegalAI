import uuid
from datetime import datetime
from pydantic import BaseModel
from app.db.models import IngestionStatus


class DocumentResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    filename: str
    file_type: str
    ingestion_status: IngestionStatus
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    ingestion_status: IngestionStatus
    error_message: str | None

    model_config = {"from_attributes": True}
