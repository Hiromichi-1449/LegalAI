import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, Enum, Float, ForeignKey, Integer,
    String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
import enum


class Base(DeclarativeBase):
    pass


# ─── Enums ────────────────────────────────────────────────────────────────────

class IngestionStatus(str, enum.Enum):
    pending    = "pending"
    processing = "processing"
    complete   = "complete"
    failed     = "failed"


class MessageRole(str, enum.Enum):
    user      = "user"
    assistant = "assistant"


class EmailDirection(str, enum.Enum):
    inbound  = "inbound"
    outbound = "outbound"


class EmailStatus(str, enum.Enum):
    draft    = "draft"
    sent     = "sent"
    received = "received"


# ─── Tables ───────────────────────────────────────────────────────────────────

class Firm(Base):
    __tablename__ = "firms"

    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name:       Mapped[str]       = mapped_column(String, nullable=False)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())

    users:         Mapped[list["User"]]         = relationship(back_populates="firm")
    clients:       Mapped[list["Client"]]       = relationship(back_populates="firm")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="firm")


class User(Base):
    __tablename__ = "users"

    id:              Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth0_sub:       Mapped[str]       = mapped_column(String, unique=True, nullable=False)
    firm_id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    email:           Mapped[str]       = mapped_column(String, nullable=False)
    full_name:       Mapped[str]       = mapped_column(String, nullable=False)
    preferred_model: Mapped[str]       = mapped_column(
        String,
        nullable=False,
        default="meta-llama/Llama-3.3-70B-Instruct-Turbo",
    )
    gmail_address:   Mapped[str | None] = mapped_column(String, nullable=True)
    created_at:      Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())

    firm:          Mapped["Firm"]              = relationship(back_populates="users")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user")
    email_token:   Mapped["EmailToken | None"] = relationship(back_populates="user", uselist=False)
    emails:        Mapped[list["Email"]]       = relationship(back_populates="user")


class Client(Base):
    __tablename__ = "clients"

    id:         Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:    Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    first_name: Mapped[str]        = mapped_column(String, nullable=False)
    last_name:  Mapped[str]        = mapped_column(String, nullable=False)
    email:      Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now())

    firm:          Mapped["Firm"]               = relationship(back_populates="clients")
    documents:     Mapped[list["Document"]]     = relationship(back_populates="client")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="client")
    emails:        Mapped[list["Email"]]        = relationship(back_populates="client")


class Document(Base):
    __tablename__ = "documents"

    id:               Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:          Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    client_id:        Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    uploaded_by:      Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename:         Mapped[str]               = mapped_column(String, nullable=False)
    storage_path:     Mapped[str]               = mapped_column(String, nullable=False)
    file_type:        Mapped[str]               = mapped_column(String, nullable=False)  # 'pdf' | 'docx'
    ingestion_status: Mapped[IngestionStatus]   = mapped_column(Enum(IngestionStatus), nullable=False, default=IngestionStatus.pending)
    error_message:    Mapped[str | None]        = mapped_column(Text, nullable=True)
    created_at:       Mapped[datetime]          = mapped_column(DateTime(timezone=True), server_default=func.now())

    client: Mapped["Client"]               = relationship(back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]]  = relationship(back_populates="document")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:     Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    client_id:   Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index: Mapped[int]       = mapped_column(Integer, nullable=False)
    content:     Mapped[str]       = mapped_column(Text, nullable=False)
    embedding:   Mapped[list[float]] = mapped_column(Vector(1536), nullable=False)
    created_at:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="chunks")


class Conversation(Base):
    __tablename__ = "conversations"

    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:    Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    user_id:    Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_id:  Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    title:      Mapped[str]       = mapped_column(String, nullable=False)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    firm:     Mapped["Firm"]          = relationship(back_populates="conversations")
    user:     Mapped["User"]          = relationship(back_populates="conversations")
    client:   Mapped["Client"]        = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id:              Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:         Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    conversation_id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role:            Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content:         Mapped[str]        = mapped_column(Text, nullable=False)
    model_used:      Mapped[str | None] = mapped_column(String, nullable=True)
    created_at:      Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class EmailToken(Base):
    __tablename__ = "email_tokens"

    id:            Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:       Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    firm_id:       Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    access_token:  Mapped[str]       = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str]       = mapped_column(Text, nullable=False)
    token_expiry:  Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False)
    created_at:    Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:    Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="email_token")


class Email(Base):
    __tablename__ = "emails"

    id:                  Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:             Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    user_id:             Mapped[uuid.UUID]        = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_id:           Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    direction:           Mapped[EmailDirection]   = mapped_column(Enum(EmailDirection), nullable=False)
    status:              Mapped[EmailStatus]      = mapped_column(Enum(EmailStatus), nullable=False, default=EmailStatus.draft)
    from_address:        Mapped[str]              = mapped_column(String, nullable=False)
    to_address:          Mapped[str]              = mapped_column(String, nullable=False)
    subject:             Mapped[str]              = mapped_column(String, nullable=False)
    body:                Mapped[str]              = mapped_column(Text, nullable=False)
    gmail_message_id:    Mapped[str | None]       = mapped_column(String, unique=True, nullable=True)
    sendgrid_message_id: Mapped[str | None]       = mapped_column(String, nullable=True)
    is_read:             Mapped[bool]             = mapped_column(Boolean, nullable=False, default=False)
    received_at:         Mapped[datetime | None]  = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:          Mapped[datetime]         = mapped_column(DateTime(timezone=True), server_default=func.now())

    user:   Mapped["User"]          = relationship(back_populates="emails")
    client: Mapped["Client | None"] = relationship(back_populates="emails")


class SplunkAlert(Base):
    __tablename__ = "splunk_alerts"

    id:               Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id:          Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False)
    user_id:          Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    alert_name:       Mapped[str]            = mapped_column(String, nullable=False)
    payload:          Mapped[dict]           = mapped_column(JSONB, nullable=False)
    splunk_search_id: Mapped[str | None]     = mapped_column(String, nullable=True)
    risk_score:       Mapped[float | None]   = mapped_column(Float, nullable=True)
    received_at:      Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    acknowledged:     Mapped[bool]           = mapped_column(Boolean, nullable=False, default=False)
