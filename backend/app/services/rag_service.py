import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.db.models import DocumentChunk, Document, User
from app.config import settings
from openai import AsyncOpenAI

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

EMBEDDING_MODEL = "text-embedding-3-small"
TOP_K = 5


async def embed_query(query: str) -> list[float]:
    response = await openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=query,
    )
    return response.data[0].embedding


async def retrieve(
    db: AsyncSession,
    user: User,
    client_id: uuid.UUID,
    query: str,
) -> list[dict]:
    """
    Embed the query, cosine-search document_chunks scoped to client + firm,
    return top-K chunks with their source filename.
    """
    query_embedding = await embed_query(query)
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    sql = text("""
        SELECT
            dc.content,
            dc.chunk_index,
            d.filename
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE dc.client_id = :client_id
          AND dc.firm_id   = :firm_id
        ORDER BY dc.embedding <=> :embedding ::vector
        LIMIT :top_k
    """)

    result = await db.execute(sql, {
        "client_id": client_id,
        "firm_id":   user.firm_id,
        "embedding": embedding_str,
        "top_k":     TOP_K,
    })
    rows = result.fetchall()

    return [
        {"content": row.content, "filename": row.filename, "chunk_index": row.chunk_index}
        for row in rows
    ]


def build_context_string(chunks: list[dict]) -> str:
    if not chunks:
        return "No relevant documents found for this client."
    parts = []
    for chunk in chunks:
        parts.append(f"[Source: {chunk['filename']}]\n{chunk['content']}")
    return "\n\n".join(parts)
