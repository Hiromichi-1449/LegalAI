import pytest
import io
from unittest.mock import patch, MagicMock, AsyncMock
from app.db.models import Client


@pytest.fixture
async def test_client_obj(test_user, seeded_db):
    c = Client(firm_id=test_user.firm_id, first_name="Doc", last_name="Owner")
    seeded_db.add(c)
    await seeded_db.commit()
    return c


@pytest.mark.asyncio
async def test_list_documents_empty(client, test_client_obj):
    response = await client.get("/documents", params={"client_id": str(test_client_obj.id)})
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_upload_document(client, test_client_obj):
    mock_supabase = MagicMock()
    mock_supabase.storage.from_().upload.return_value = None

    pdf_bytes = b"%PDF-1.4 test content"
    with patch("app.routers.documents.supabase", mock_supabase), \
         patch("app.routers.documents.ingest_document", AsyncMock()):
        response = await client.post(
            "/documents/upload",
            data={"client_id": str(test_client_obj.id)},
            files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )

    assert response.status_code == 202
    data = response.json()
    assert data["filename"] == "test.pdf"
    assert data["ingestion_status"] == "pending"
    assert data["file_type"] == "pdf"


@pytest.mark.asyncio
async def test_upload_unsupported_type(client, test_client_obj):
    with patch("app.routers.documents.supabase", MagicMock()):
        response = await client.post(
            "/documents/upload",
            data={"client_id": str(test_client_obj.id)},
            files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_get_document_status(client, test_client_obj):
    mock_supabase = MagicMock()
    mock_supabase.storage.from_().upload.return_value = None

    with patch("app.routers.documents.supabase", mock_supabase), \
         patch("app.routers.documents.ingest_document", AsyncMock()):
        create_resp = await client.post(
            "/documents/upload",
            data={"client_id": str(test_client_obj.id)},
            files={"file": ("doc.pdf", io.BytesIO(b"%PDF"), "application/pdf")},
        )
    doc_id = create_resp.json()["id"]

    status_resp = await client.get(f"/documents/{doc_id}/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["ingestion_status"] == "pending"
