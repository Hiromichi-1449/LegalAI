import uuid
from fastapi import APIRouter
from sqlalchemy import select

from app.dependencies import CurrentUser, DB
from app.db.models import Client
from app.schemas.client import ClientCreate, ClientResponse
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter()


@router.get("", response_model=list[ClientResponse])
async def list_clients(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Client).where(Client.firm_id == current_user.firm_id)
        .order_by(Client.last_name, Client.first_name)
    )
    return list(result.scalars().all())


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(body: ClientCreate, current_user: CurrentUser, db: DB):
    client = Client(
        firm_id=current_user.firm_id,
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise NotFoundError("Client not found")
    if client.firm_id != current_user.firm_id:
        raise ForbiddenError()
    return client


@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: uuid.UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise NotFoundError("Client not found")
    if client.firm_id != current_user.firm_id:
        raise ForbiddenError()
    await db.delete(client)
    await db.commit()
