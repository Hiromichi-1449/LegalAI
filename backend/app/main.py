import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.routers import auth, users, clients, conversations, chat, documents, emails, gmail, internal

app = FastAPI(title="LegalAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next) -> Response:
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


register_exception_handlers(app)

app.include_router(auth.router,          prefix="/auth",          tags=["auth"])
app.include_router(users.router,         prefix="/users",         tags=["users"])
app.include_router(clients.router,       prefix="/clients",       tags=["clients"])
app.include_router(conversations.router, prefix="/conversations",  tags=["conversations"])
app.include_router(chat.router,          prefix="/chat",          tags=["chat"])
app.include_router(documents.router,     prefix="/documents",     tags=["documents"])
app.include_router(emails.router,        prefix="/emails",        tags=["emails"])
app.include_router(gmail.router,         prefix="/gmail",         tags=["gmail"])

if settings.splunk_enabled:
    app.include_router(internal.router, prefix="/internal", tags=["internal"])


@app.get("/health")
async def health():
    return {"status": "ok"}
