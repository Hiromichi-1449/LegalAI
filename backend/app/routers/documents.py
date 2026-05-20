import uuid
from fastapi import APIRouter, Request, UploadFile, File, Form, BackgroundTasks
from sqlalchemy import select

from app.dependencies import CurrentUser, DB
from app.db.models import Document, IngestionStatus
from app.schemas.document import DocumentResponse, DocumentStatusResponse
from app.services.ingestion_service import ingest_document, supabase, BUCKET_NAME
from app.core.exceptions import NotFoundError, ForbiddenError
from app.services import splunk_service

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


@router.post("/upload", response_model=DocumentResponse, status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    request: Request,
    client_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
    db: DB = None,
):
    if file.content_type not in ALLOWED_TYPES:
        from fastapi import HTTPException
        raise HTTPException(status_code=415, detail="Only PDF and DOCX files are supported")

    file_type = ALLOWED_TYPES[file.content_type]
    storage_path = f"{current_user.firm_id}/{client_id}/{file.filename}"

    # Upload to Supabase Storage
    file_bytes = await file.read()
    supabase.storage.from_(BUCKET_NAME).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": file.content_type},
    )

    doc = Document(
        firm_id=current_user.firm_id,
        client_id=client_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        storage_path=storage_path,
        file_type=file_type,
        ingestion_status=IngestionStatus.pending,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    splunk_service.emit({
        "event_type": "document.uploaded",
        "request_id": getattr(request.state, "request_id", None),
        "firm_id": str(current_user.firm_id),
        "user_id": str(current_user.id),
        "client_id": str(client_id),
        "document_id": str(doc.id),
        "file_type": file_type,
    })

    background_tasks.add_task(ingest_document, doc.id, getattr(request.state, "request_id", None))

    return doc


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundError("Document not found")
    if doc.firm_id != current_user.firm_id:
        raise ForbiddenError()
    return doc


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    client_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
):
    result = await db.execute(
        select(Document)
        .where(Document.client_id == client_id, Document.firm_id == current_user.firm_id)
        .order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


SIGNED_URL_EXPIRY_SECONDS = 300  # 5 minutes


@router.get("/{document_id}/download-url")
async def get_download_url(
    document_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: DB,
) -> dict[str, str]:
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundError("Document not found")
    if doc.firm_id != current_user.firm_id:
        raise ForbiddenError()

    signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        doc.storage_path, SIGNED_URL_EXPIRY_SECONDS
    )
    signed_url = signed["signedURL"]

    splunk_service.emit({
        "event_type": "document.download_url_issued",
        "request_id": getattr(request.state, "request_id", None),
        "firm_id": str(current_user.firm_id),
        "user_id": str(current_user.id),
        "client_id": str(doc.client_id),
        "document_id": str(doc.id),
        "file_type": doc.file_type,
    })

    return {"url": signed_url}


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundError("Document not found")
    if doc.firm_id != current_user.firm_id:
        raise ForbiddenError()
    # Remove from Supabase Storage
    supabase.storage.from_(BUCKET_NAME).remove([doc.storage_path])
    await db.delete(doc)
    await db.commit()
