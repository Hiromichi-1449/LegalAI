import secrets
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select

from app.config import settings
from app.db.models import SplunkAlert
from app.dependencies import CurrentUser, DB

router = APIRouter()


class SplunkAlertResponse(BaseModel):
    id: uuid.UUID
    firm_id: uuid.UUID
    user_id: uuid.UUID | None
    alert_name: str
    payload: dict[str, Any]
    splunk_search_id: str | None
    risk_score: float | None
    received_at: datetime
    acknowledged: bool

    model_config = {"from_attributes": True}


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


@router.get("/splunk-alerts", response_model=list[SplunkAlertResponse])
async def list_splunk_alerts(
    current_user: CurrentUser,
    db: DB,
    acknowledged: bool | None = None,
    limit: int = 50,
) -> list[SplunkAlert]:
    query = (
        select(SplunkAlert)
        .where(SplunkAlert.firm_id == current_user.firm_id)
        .order_by(SplunkAlert.received_at.desc())
        .limit(limit)
    )
    if acknowledged is not None:
        query = query.where(SplunkAlert.acknowledged == acknowledged)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.patch("/splunk-alerts/{alert_id}/acknowledge", response_model=SplunkAlertResponse)
async def acknowledge_splunk_alert(
    alert_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> SplunkAlert:
    result = await db.execute(select(SplunkAlert).where(SplunkAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.firm_id != current_user.firm_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    alert.acknowledged = True
    await db.commit()
    await db.refresh(alert)
    return alert
