import pytest
import uuid


@pytest.mark.asyncio
async def test_create_client(client, test_user):
    response = await client.post("/clients", json={
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["firm_id"] == str(test_user.firm_id)


@pytest.mark.asyncio
async def test_list_clients(client):
    await client.post("/clients", json={"first_name": "Alice", "last_name": "Smith"})
    await client.post("/clients", json={"first_name": "Bob", "last_name": "Jones"})

    response = await client.get("/clients")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_client(client):
    create_response = await client.post("/clients", json={"first_name": "Alice", "last_name": "Smith"})
    client_id = create_response.json()["id"]

    response = await client.get(f"/clients/{client_id}")
    assert response.status_code == 200
    assert response.json()["id"] == client_id


@pytest.mark.asyncio
async def test_delete_client(client):
    create_response = await client.post("/clients", json={"first_name": "Del", "last_name": "Me"})
    client_id = create_response.json()["id"]

    delete_response = await client.delete(f"/clients/{client_id}")
    assert delete_response.status_code == 204

    list_response = await client.get("/clients")
    assert all(c["id"] != client_id for c in list_response.json())


@pytest.mark.asyncio
async def test_get_client_not_found(client):
    response = await client.get(f"/clients/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_client_no_email(client):
    response = await client.post("/clients", json={"first_name": "No", "last_name": "Email"})
    assert response.status_code == 201
    assert response.json()["email"] is None
