import pytest


@pytest.mark.asyncio
async def test_deployed_frontend_can_preflight_authenticated_client_creation(client):
    response = await client.options(
        "/clients",
        headers={
            "Origin": "https://legalai.consulting",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization, content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://legalai.consulting"
    assert "authorization" in response.headers["access-control-allow-headers"].lower()
    assert "content-type" in response.headers["access-control-allow-headers"].lower()
