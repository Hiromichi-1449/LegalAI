import uuid
from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DB
from app.db.models import Conversation, Message
from app.schemas.conversation import ConversationCreate, ConversationResponse, MessageResponse
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter()


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_conversation(body: ConversationCreate, current_user: CurrentUser, db: DB):
    conv = Conversation(
        firm_id=current_user.firm_id,
        user_id=current_user.id,
        client_id=body.client_id,
        title=body.title,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(conversation_id: uuid.UUID, current_user: CurrentUser, db: DB):
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    if conv.user_id != current_user.id:
        raise ForbiddenError()

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    return list(result.scalars().all())


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    if conv.user_id != current_user.id:
        raise ForbiddenError()
    await db.delete(conv)
    await db.commit()
