from fastapi import APIRouter
from app.dependencies import CurrentUser, DB
from app.schemas.email import EmailSendRequest, EmailDraftRequest, EmailResponse
from app.services import email_service

router = APIRouter()


@router.get("", response_model=list[EmailResponse])
async def list_emails(current_user: CurrentUser, db: DB):
    return await email_service.list_emails(db, current_user)


@router.post("/send", response_model=EmailResponse, status_code=201)
async def send_email(body: EmailSendRequest, current_user: CurrentUser, db: DB):
    return await email_service.send_email(
        db, current_user,
        to_address=body.to_address,
        subject=body.subject,
        body=body.body,
        client_id=body.client_id,
    )


@router.post("/draft", response_model=EmailResponse, status_code=201)
async def save_draft(body: EmailDraftRequest, current_user: CurrentUser, db: DB):
    return await email_service.save_draft(
        db, current_user,
        to_address=body.to_address,
        subject=body.subject,
        body=body.body,
        client_id=body.client_id,
    )
