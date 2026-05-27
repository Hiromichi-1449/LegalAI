from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    # Required for PgBouncer transaction pooling (Supabase port 6543).
    # asyncpg caches prepared statements per-connection; PgBouncer shuffles
    # connections between transactions, so those statements don't survive.
    # Disabling the cache makes every query a simple text query instead.
    connect_args={"statement_cache_size": 0},
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
