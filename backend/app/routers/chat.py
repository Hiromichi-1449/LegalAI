import time
import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.dependencies import CurrentUser, DB
from app.db.models import Conversation, Message, MessageRole
from app.schemas.chat import ChatRequest, GuestChatRequest
from app.services import rag_service, llm_service, splunk_service
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter()

HISTORY_LIMIT = 15


@router.post("/guest")
async def send_guest_message(body: GuestChatRequest):
    history = body.history[-HISTORY_LIMIT:]
    messages = [
        {
            "role": "system",
            "content": (
                "You are a legal AI assistant for general information. "
                "Answer clearly, avoid claiming to be a lawyer, and remind users to consult "
                "qualified counsel for advice about their specific situation."
            ),
        },
        *[
            {"role": msg.role, "content": msg.content}
            for msg in history
            if msg.role in {"user", "assistant"} and msg.content.strip()
        ],
        {"role": "user", "content": body.message},
    ]

    async def event_stream():
        try:
            async for item in llm_service.stream_messages(body.model, messages):
                if not isinstance(item, dict):
                    yield f"data: {json.dumps({'token': item})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': 'Stream failed'})}\n\n"
            return

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{conversation_id}")
async def send_message(
    conversation_id: uuid.UUID,
    request: Request,
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
    request_id = getattr(request.state, "request_id", None)
    base_event = {
        "request_id": request_id,
        "firm_id": str(current_user.firm_id),
        "user_id": str(current_user.id),
        "client_id": str(conv.client_id),
        "conversation_id": str(conversation_id),
    }

    rag_start = time.monotonic()
    chunks = await rag_service.retrieve(db, current_user, conv.client_id, body.message)
    rag_latency_ms = int((time.monotonic() - rag_start) * 1000)
    context = rag_service.build_context_string(chunks)

    splunk_service.emit({
        "event_type": "rag.retrieval_completed",
        "retrieved_chunks": len(chunks),
        "latency_ms": rag_latency_ms,
        **base_event,
    })

    model = current_user.preferred_model

    async def event_stream():
        full_response = []
        input_tokens: int | None = None
        output_tokens: int | None = None
        llm_start = time.monotonic()

        try:
            async for item in llm_service.stream_response(model, context, history, body.message):
                if isinstance(item, dict):
                    usage = item.get("usage", {})
                    input_tokens = usage.get("input_tokens")
                    output_tokens = usage.get("output_tokens")
                else:
                    full_response.append(item)
                    yield f"data: {json.dumps({'token': item})}\n\n"
        except Exception as exc:
            splunk_service.emit({
                "event_type": "llm.error",
                "model": model,
                "error_category": type(exc).__name__,
                "latency_ms": int((time.monotonic() - llm_start) * 1000),
                **base_event,
            })
            yield f"data: {json.dumps({'error': 'Stream failed'})}\n\n"
            return

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

        splunk_service.emit({
            "event_type": "rag.answer_generated",
            "model": model,
            "retrieved_chunks": len(chunks),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": int((time.monotonic() - llm_start) * 1000),
            **base_event,
        })

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
