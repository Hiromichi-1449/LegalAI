from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.routers import auth, users, clients, conversations, chat, documents, emails, gmail

app = FastAPI(title="LegalAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router,          prefix="/auth",          tags=["auth"])
app.include_router(users.router,         prefix="/users",         tags=["users"])
app.include_router(clients.router,       prefix="/clients",       tags=["clients"])
app.include_router(conversations.router, prefix="/conversations",  tags=["conversations"])
app.include_router(chat.router,          prefix="/chat",          tags=["chat"])
app.include_router(documents.router,     prefix="/documents",     tags=["documents"])
app.include_router(emails.router,        prefix="/emails",        tags=["emails"])
app.include_router(gmail.router,         prefix="/gmail",         tags=["gmail"])


@app.get("/health")
async def health():
    return {"status": "ok"}
