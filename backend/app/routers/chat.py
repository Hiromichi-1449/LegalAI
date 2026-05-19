import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.dependencies import CurrentUser, DB
from app.db.models import Conversation, Message, MessageRole
from app.schemas.chat import ChatRequest
from app.services import rag_service, llm_service
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter()

HISTORY_LIMIT = 15


@router.post("/{conversation_id}")
async def send_message(
    conversation_id: uuid.UUID,
    body: ChatRequest,
    current_user: CurrentUser,
    db: DB,
):
    # Verify conversation belongs to user
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    if conv.user_id != current_user.id:
        raise ForbiddenError()

    # Persist user message
    user_msg = Message(
        firm_id=current_user.firm_id,
        conversation_id=conversation_id,
        role=MessageRole.user,
        content=body.message,
    )
    db.add(user_msg)
    await db.commit()

    # Retrieve last 15 messages for history (excluding the one just added)
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(HISTORY_LIMIT + 1)
    )
    history = list(reversed(history_result.scalars().all()))[:-1]  # exclude current user msg

    # RAG retrieval scoped to the conversation's client
    chunks = await rag_service.retrieve(db, current_user, conv.client_id, body.message)
    context = rag_service.build_context_string(chunks)

    model = current_user.preferred_model

    async def event_stream():
        full_response = []
        input_tokens: int | None = None
        output_tokens: int | None = None

        async for item in llm_service.stream_response(model, context, history, body.message):
            if isinstance(item, dict):
                usage = item.get("usage", {})
                input_tokens = usage.get("input_tokens")
                output_tokens = usage.get("output_tokens")
            else:
                full_response.append(item)
                yield f"data: {json.dumps({'token': item})}\n\n"

        # Persist assistant message after stream completes
        assistant_content = "".join(full_response)
        now = datetime.now(timezone.utc)
        async with db.begin():
            assistant_msg = Message(
                firm_id=current_user.firm_id,
                conversation_id=conversation_id,
                role=MessageRole.assistant,
                content=assistant_content,
                model_used=model,
            )
            db.add(assistant_msg)
            conv.updated_at = now

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
