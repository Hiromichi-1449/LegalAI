from typing import Any, AsyncGenerator
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.config import settings
from app.db.models import Message, MessageRole

openai_client  = AsyncOpenAI(api_key=settings.openai_api_key)
anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

OPENAI_MODELS    = {"gpt-5.4", "gpt-5.5-turbo", "gpt-5.4-mini"}
ANTHROPIC_MODELS = {"claude-sonnet-4-6", "claude-haiku-4-5-20251001", "claude-opus-4-6"}

SYSTEM_PROMPT = """\
You are a legal AI assistant. Answer questions using ONLY the provided document excerpts.
Cite the source document for each claim (e.g. "According to contract_draft.pdf, ...").
If the answer is not in the documents, say so explicitly — do not speculate.
"""


def _build_messages(
    context: str,
    history: list[Message],
    user_message: str,
) -> list[dict]:
    messages = [
        {
            "role": "system",
            "content": (
                f"{SYSTEM_PROMPT}\n\n"
                f"--- DOCUMENT CONTEXT ---\n{context}\n--- END CONTEXT ---"
            ),
        }
    ]
    for msg in history:
        messages.append({"role": msg.role.value, "content": msg.content})
    messages.append({"role": "user", "content": user_message})
    return messages


async def stream_response(
    model: str,
    context: str,
    history: list[Message],
    user_message: str,
) -> AsyncGenerator[str | dict[str, Any], None]:
    """Yields text tokens followed by a final usage sentinel dict.

    Callers must handle the sentinel: isinstance(item, dict) → usage data,
    not a token. Sentinel shape: {"usage": {"input_tokens": N, "output_tokens": N}}
    """
    messages = _build_messages(context, history, user_message)

    if model in OPENAI_MODELS:
        async for chunk in _stream_openai(model, messages):
            yield chunk
    elif model in ANTHROPIC_MODELS:
        async for chunk in _stream_anthropic(model, messages):
            yield chunk
    else:
        async for chunk in _stream_openai("gpt-5.4", messages):
            yield chunk


async def _stream_openai(
    model: str, messages: list[dict]
) -> AsyncGenerator[str | dict[str, Any], None]:
    stream = await openai_client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        stream_options={"include_usage": True},
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
        if chunk.usage:
            yield {
                "usage": {
                    "input_tokens": chunk.usage.prompt_tokens,
                    "output_tokens": chunk.usage.completion_tokens,
                }
            }


async def _stream_anthropic(
    model: str, messages: list[dict]
) -> AsyncGenerator[str | dict[str, Any], None]:
    system = messages[0]["content"]
    chat_messages = messages[1:]

    async with anthropic_client.messages.stream(
        model=model,
        max_tokens=4096,
        system=system,
        messages=chat_messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text
        final = await stream.get_final_message()
        yield {
            "usage": {
                "input_tokens": final.usage.input_tokens,
                "output_tokens": final.usage.output_tokens,
            }
        }
