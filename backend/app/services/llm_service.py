from typing import Any, AsyncGenerator
from openai import AsyncOpenAI

from app.config import settings
from app.db.models import Message

together_client = AsyncOpenAI(
    api_key=settings.together_api_key,
    base_url="https://api.together.xyz/v1",
)

DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
SUPPORTED_MODELS = {
    DEFAULT_MODEL,
    "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
    "google/gemma-4-31B-it",
    "google/gemma-3n-E4B-it",
}

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

    async for chunk in _stream_together(model, messages):
        yield chunk


async def stream_messages(
    model: str,
    messages: list[dict],
) -> AsyncGenerator[str | dict[str, Any], None]:
    async for chunk in _stream_together(model, messages):
        yield chunk


async def _stream_together(
    model: str, messages: list[dict]
) -> AsyncGenerator[str | dict[str, Any], None]:
    stream = await together_client.chat.completions.create(
        model=model if model in SUPPORTED_MODELS else DEFAULT_MODEL,
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
