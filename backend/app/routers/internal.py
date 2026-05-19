import secrets
import uuid
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import settings
from app.db.models import SplunkAlert
from app.dependencies import DB

router = APIRouter()


def _verify_splunk_secret(x_splunk_alert_secret: str | None) -> None:
    if not x_splunk_alert_secret or not secrets.compare_digest(
        x_splunk_alert_secret, settings.splunk_alert_secret
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/splunk-alert", status_code=status.HTTP_200_OK)
async def receive_splunk_alert(
    request: Request,
    db: DB,
    x_splunk_alert_secret: str | None = Header(default=None),
) -> dict[str, str]:
    _verify_splunk_secret(x_splunk_alert_secret)

    payload: dict[str, Any] = await request.json()

    alert = SplunkAlert(
        firm_id=uuid.UUID(payload["firm_id"]) if "firm_id" in payload else None,
        user_id=uuid.UUID(payload["user_id"]) if "user_id" in payload else None,
        alert_name=payload.get("alert_name", "unknown"),
        payload=payload,
        splunk_search_id=payload.get("splunk_search_id"),
        risk_score=payload.get("risk_score"),
    )
    db.add(alert)
    await db.commit()

    return {"status": "ok"}
