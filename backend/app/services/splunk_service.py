import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def _post_to_hec(event: dict[str, Any]) -> None:
    payload = {
        "index": settings.splunk_index,
        "source": settings.splunk_source,
        "sourcetype": settings.splunk_sourcetype,
        "event": event,
    }
    try:
        async with httpx.AsyncClient(timeout=settings.splunk_timeout_seconds) as client:
            response = await client.post(
                settings.splunk_hec_url,
                json=payload,
                headers={"Authorization": f"Splunk {settings.splunk_hec_token}"},
            )
            response.raise_for_status()
    except Exception:
        logger.exception("Splunk HEC emit failed — event_type=%s", event.get("event_type"))


def emit(event: dict[str, Any]) -> None:
    """Fire-and-forget a structured event to Splunk HEC.

    Never raises — Splunk failures are logged and silently dropped.
    """
    if not settings.splunk_enabled:
        return

    if "timestamp" not in event:
        event["timestamp"] = datetime.now(timezone.utc).isoformat()

    asyncio.create_task(_post_to_hec(event))
