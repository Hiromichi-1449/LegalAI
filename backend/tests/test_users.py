import pytest


@pytest.mark.asyncio
async def test_get_me(client, test_user):
    response = await client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name
    assert data["firm_id"] == str(test_user.firm_id)


@pytest.mark.asyncio
async def test_patch_me_model(client):
    response = await client.patch("/users/me", json={"preferred_model": "claude-sonnet-4-6"})
    assert response.status_code == 200
    assert response.json()["preferred_model"] == "claude-sonnet-4-6"


@pytest.mark.asyncio
async def test_patch_me_name(client):
    response = await client.patch("/users/me", json={"full_name": "Updated Name"})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_patch_me_both(client):
    response = await client.patch("/users/me", json={
        "full_name": "New Name",
        "preferred_model": "claude-opus-4-6",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "New Name"
    assert data["preferred_model"] == "claude-opus-4-6"


@pytest.mark.asyncio
async def test_patch_me_noop(client, test_user):
    response = await client.patch("/users/me", json={})
    assert response.status_code == 200
    assert response.json()["full_name"] == test_user.full_name
