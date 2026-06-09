import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.models import Base
from app.dependencies import get_db, get_current_user
from app.db.models import User, Firm
import uuid

TEST_DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/legalai_test"


@pytest.fixture(scope="session")
def engine():
    return create_async_engine(TEST_DB_URL, echo=False)


@pytest.fixture(autouse=True)
async def setup_db(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture
def test_firm():
    return Firm(id=uuid.uuid4(), name="Test Law Firm")


@pytest.fixture
def test_user(test_firm):
    user = User(
        id=uuid.uuid4(),
        auth0_sub="auth0|testuser",
        firm_id=test_firm.id,
        email="lawyer@testfirm.com",
        full_name="Test Lawyer",
        preferred_model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
    )
    # Attach firm reference for convenience in tests
    user.firm = test_firm
    return user


@pytest.fixture
async def seeded_db(test_user, db_session):
    """Persist test_firm and test_user to the test DB."""
    db_session.add(test_user.firm)
    db_session.add(test_user)
    await db_session.commit()
    return db_session


@pytest.fixture
async def client(test_user, seeded_db):
    app.dependency_overrides[get_db] = lambda: seeded_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
