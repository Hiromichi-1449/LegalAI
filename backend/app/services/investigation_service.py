"""
AI-powered incident investigation using Claude + Splunk REST API.

Claude drives the investigation: it decides which SPL queries to run,
calls the run_splunk_search tool, reads results, and synthesises a
human-readable incident summary. This mirrors the Splunk MCP Server
pattern — Claude as the agent, Splunk as the data source.
"""

import asyncio
from typing import Any

import httpx
from anthropic import AsyncAnthropic
from anthropic.types import ToolUseBlock

from app.config import settings

anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

_SEARCH_TOOL: dict[str, Any] = {
    "name": "run_splunk_search",
    "description": (
        "Run a SPL query against the LegalAI Splunk index and return up to 50 "
        "result rows as JSON. Use this to investigate security alerts, correlate "
        "events, and gather evidence. Always include "
        "'index=legalai sourcetype=\"legalai:json\"' as the search base."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "spl_query": {
                "type": "string",
                "description": "Full SPL query string. Do not include a leading 'search' keyword.",
            },
            "earliest": {
                "type": "string",
                "description": "Relative or absolute time for the start of the search window, e.g. '-24h', '-7d'. Defaults to '-24h'.",
            },
            "latest": {
                "type": "string",
                "description": "Search window end. Defaults to 'now'.",
            },
        },
        "required": ["spl_query"],
    },
}

_SYSTEM_PROMPT = """\
You are a security investigation assistant for LegalAI, a legal AI SaaS platform used by law firms.

You have access to operational and security event data stored in Splunk. Use the run_splunk_search \
tool to query this data and investigate incidents. Run multiple targeted queries to build a \
complete picture before writing your summary.

LegalAI Splunk index: legalai  |  sourcetype: legalai:json

Key event types:
  api.request / api.error                — all HTTP activity, with latency_ms and status_code
  auth.token_validation_failed           — invalid/expired JWTs
  auth.permission_denied                 — app-layer 403s, with path
  document.uploaded / download_url_issued / ingestion_completed / ingestion_failed
  rag.retrieval_completed / rag.answer_generated — AI queries, with input_tokens, output_tokens, latency_ms
  llm.error                              — LLM provider failures
  email.sent / email.send_failed
  gmail.sync_started / sync_completed / sync_failed

Key fields: firm_id, user_id, client_id, conversation_id, request_id, event_type,
            latency_ms, status_code, model, input_tokens, output_tokens, risk_score,
            error_category, chunk_count, page_count, retrieved_chunks

Investigation approach:
1. Start broad — count events by type to understand scope.
2. Narrow to specific users, firms, or time windows showing anomalies.
3. Correlate across event types to reconstruct the timeline.
4. Write a concise final summary: what happened, who, when, risk level, recommended actions.

Do not include raw SPL in your final summary — only findings and recommendations.
"""


async def _run_splunk_query(spl_query: str, earliest: str = "-24h", latest: str = "now") -> str:
    """Execute a SPL query via the Splunk REST API, poll until done, return results as JSON string."""
    if not settings.splunk_api_url or not settings.splunk_api_token:
        return '{"error": "Splunk REST API not configured. Set SPLUNK_API_URL and SPLUNK_API_TOKEN."}'

    headers = {"Authorization": f"Bearer {settings.splunk_api_token}"}
    base = settings.splunk_api_url.rstrip("/")

    try:
        async with httpx.AsyncClient(timeout=30, verify=True) as client:
            # 1. Create search job
            create = await client.post(
                f"{base}/services/search/jobs",
                headers=headers,
                data={
                    "search": f"search {spl_query}",
                    "earliest_time": earliest,
                    "latest_time": latest,
                    "output_mode": "json",
                },
            )
            create.raise_for_status()
            sid = create.json()["sid"]

            # 2. Poll until DONE (max 15 s)
            for _ in range(15):
                await asyncio.sleep(1)
                status = await client.get(
                    f"{base}/services/search/jobs/{sid}",
                    headers=headers,
                    params={"output_mode": "json"},
                )
                state = status.json()["entry"][0]["content"]["dispatchState"]
                if state == "DONE":
                    break

            # 3. Fetch results
            results = await client.get(
                f"{base}/services/search/jobs/{sid}/results",
                headers=headers,
                params={"output_mode": "json", "count": 50},
            )
            return results.text

    except Exception as exc:
        return f'{{"error": "{type(exc).__name__}: {exc}"}}'


async def investigate(question: str, alert_context: dict[str, Any] | None = None) -> str:
    """
    Run an agentic investigation loop: Claude calls run_splunk_search as needed,
    then writes a human-readable incident summary.
    """
    user_content = question
    if alert_context:
        user_content = (
            f"{question}\n\n"
            f"Alert context from LegalAI:\n{alert_context}"
        )

    messages: list[dict[str, Any]] = [{"role": "user", "content": user_content}]

    for _ in range(8):  # cap at 8 tool-call rounds to prevent runaway loops
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=_SYSTEM_PROMPT,
            tools=[_SEARCH_TOOL],
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return "Investigation complete — no textual findings returned."

        # Append assistant turn
        messages.append({"role": "assistant", "content": response.content})

        # Execute tool calls
        tool_results: list[dict[str, Any]] = []
        for block in response.content:
            if isinstance(block, ToolUseBlock):
                result = await _run_splunk_query(
                    spl_query=block.input.get("spl_query", ""),
                    earliest=block.input.get("earliest", "-24h"),
                    latest=block.input.get("latest", "now"),
                )
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

        if not tool_results:
            # stop_reason was tool_use but no ToolUseBlock found — shouldn't happen
            break

        messages.append({"role": "user", "content": tool_results})

    return "Investigation reached the maximum query depth. Review Splunk directly for more detail."
