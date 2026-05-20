import time
import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.routers import auth, users, clients, conversations, chat, documents, emails, gmail, internal
from app.services import splunk_service

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


@app.middleware("http")
async def api_observability(request: Request, call_next) -> Response:
    start = time.monotonic()
    response = await call_next(request)
    latency_ms = int((time.monotonic() - start) * 1000)

    base = {
        "firm_id": getattr(request.state, "firm_id", None),
        "user_id": getattr(request.state, "user_id", None),
        "request_id": getattr(request.state, "request_id", None),
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "latency_ms": latency_ms,
    }

    splunk_service.emit({"event_type": "api.request", **base})

    if response.status_code >= 500:
        splunk_service.emit({"event_type": "api.error", **base})
    elif response.status_code == 403:
        splunk_service.emit({"event_type": "auth.permission_denied", **base})

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
