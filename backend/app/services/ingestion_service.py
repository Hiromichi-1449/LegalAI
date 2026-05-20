import time
import uuid
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Document, DocumentChunk, IngestionStatus
from app.db.session import async_session
from app.config import settings
from app.services import splunk_service
from openai import AsyncOpenAI
from supabase import create_client

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
supabase = create_client(settings.supabase_url, settings.supabase_service_key)

EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE      = 1000
CHUNK_OVERLAP   = 200
BUCKET_NAME     = "documents"


def _chunk_text(text: str) -> list[str]:
    """Simple recursive character text splitter."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    return splitter.split_text(text)


def _extract_text_pdf(file_bytes: bytes) -> tuple[str, int]:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(file_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return text, len(reader.pages)


def _extract_text_docx(file_bytes: bytes) -> str:
    from docx import Document as DocxDocument
    doc = DocxDocument(io.BytesIO(file_bytes))
    return "\n".join(para.text for para in doc.paragraphs)


async def _embed_chunks(chunks: list[str]) -> list[list[float]]:
    response = await openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=chunks,
    )
    return [item.embedding for item in response.data]


async def ingest_document(document_id: uuid.UUID, request_id: str | None = None) -> None:
    """
    Background task: parse → chunk → embed → store.
    Uses a fresh DB session (not the request session).
    """
    async with async_session() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if doc is None:
            return

        base_event = {
            "request_id": request_id,
            "firm_id": str(doc.firm_id),
            "user_id": str(doc.uploaded_by),
            "client_id": str(doc.client_id),
            "document_id": str(doc.id),
            "file_type": doc.file_type,
        }

        # Mark processing
        doc.ingestion_status = IngestionStatus.processing
        await db.commit()

        splunk_service.emit({"event_type": "document.ingestion_started", **base_event})
        start = time.monotonic()

        try:
            # Download from Supabase Storage
            file_bytes = supabase.storage.from_(BUCKET_NAME).download(doc.storage_path)

            # Extract text
            page_count: int | None = None
            if doc.file_type == "pdf":
                text, page_count = _extract_text_pdf(file_bytes)
            elif doc.file_type == "docx":
                text = _extract_text_docx(file_bytes)
            else:
                raise ValueError(f"Unsupported file type: {doc.file_type}")

            if not text.strip():
                raise ValueError("No text could be extracted from document")

            # Chunk
            chunks = _chunk_text(text)

            # Embed (batch)
            embeddings = await _embed_chunks(chunks)

            # Bulk insert chunks
            db.add_all([
                DocumentChunk(
                    firm_id=doc.firm_id,
                    client_id=doc.client_id,
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk,
                    embedding=embedding,
                )
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
            ])

            doc.ingestion_status = IngestionStatus.complete
            await db.commit()

            splunk_service.emit({
                "event_type": "document.ingestion_completed",
                "chunk_count": len(chunks),
                "page_count": page_count,
                "latency_ms": int((time.monotonic() - start) * 1000),
                **base_event,
            })

        except Exception as exc:
            doc.ingestion_status = IngestionStatus.failed
            doc.error_message = str(exc)
            await db.commit()

            splunk_service.emit({
                "event_type": "document.ingestion_failed",
                "error_category": type(exc).__name__,
                "latency_ms": int((time.monotonic() - start) * 1000),
                **base_event,
            })
            raise
