import pytest
import uuid
from app.db.models import Client


@pytest.fixture
async def test_client_obj(test_user, seeded_db):
    c = Client(
        firm_id=test_user.firm_id,
        first_name="Test",
        last_name="Client",
    )
    seeded_db.add(c)
    await seeded_db.commit()
    return c


@pytest.mark.asyncio
async def test_create_conversation(client, test_client_obj):
    response = await client.post("/conversations", json={
        "client_id": str(test_client_obj.id),
        "title": "Contract Review",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Contract Review"
    assert data["client_id"] == str(test_client_obj.id)


@pytest.mark.asyncio
async def test_list_conversations(client, test_client_obj):
    await client.post("/conversations", json={"client_id": str(test_client_obj.id), "title": "Conv 1"})
    await client.post("/conversations", json={"client_id": str(test_client_obj.id), "title": "Conv 2"})

    response = await client.get("/conversations")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_messages_empty(client, test_client_obj):
    create_resp = await client.post("/conversations", json={
        "client_id": str(test_client_obj.id),
        "title": "Empty",
    })
    conv_id = create_resp.json()["id"]

    response = await client.get(f"/conversations/{conv_id}/messages")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_delete_conversation(client, test_client_obj):
    create_resp = await client.post("/conversations", json={
        "client_id": str(test_client_obj.id),
        "title": "To Delete",
    })
    conv_id = create_resp.json()["id"]

    del_resp = await client.delete(f"/conversations/{conv_id}")
    assert del_resp.status_code == 204

    list_resp = await client.get("/conversations")
    assert all(c["id"] != conv_id for c in list_resp.json())


@pytest.mark.asyncio
async def test_get_messages_forbidden(client, test_user, seeded_db):
    """Conversation owned by another user returns 403."""
    from app.db.models import Conversation, Firm, User
    other_firm = Firm(id=uuid.uuid4(), name="Other Firm")
    other_user = User(
        id=uuid.uuid4(),
        auth0_sub="auth0|other",
        firm_id=other_firm.id,
        email="other@firm.com",
        full_name="Other",
        preferred_model="gpt-5.4",
    )
    other_client = Client(firm_id=other_firm.id, first_name="X", last_name="Y")
    seeded_db.add(other_firm)
    seeded_db.add(other_user)
    seeded_db.add(other_client)
    await seeded_db.flush()
    conv = Conversation(
        firm_id=other_firm.id,
        user_id=other_user.id,
        client_id=other_client.id,
        title="Private",
    )
    seeded_db.add(conv)
    await seeded_db.commit()

    response = await client.get(f"/conversations/{conv.id}/messages")
    assert response.status_code == 403
