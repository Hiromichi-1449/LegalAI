# LegalAI

A multi-tenant SaaS platform that gives lawyers an AI-powered chat interface grounded in their own case documents.

## What it does

- **RAG chat** — upload PDFs and DOCX files to a client matter; ask questions and get answers cited directly from those documents.
- **Streaming responses** — answers stream token-by-token via SSE using Meta Llama and Google Gemma models.
- **Client matters** — organise documents and conversations by client.
- **Email** — compose and send emails via SendGrid, or connect Gmail to sync your inbox.
- **Multi-tenant** — each law firm gets an isolated workspace; Auth0 handles authentication (Google, LinkedIn, email/password).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS + Auth0 + Zustand + Vite |
| Backend | FastAPI + Python 3.12 + SQLAlchemy (async) + Alembic |
| Database | Supabase (Postgres + pgvector) |
| AI | OpenAI (embeddings) + Together.ai (Llama/Gemma chat) |
| Email | SendGrid (send) + Gmail API (inbox sync) |
| Storage | Supabase Storage (documents) |

## Project structure

```
LegalAI/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── routers/  # auth, users, clients, conversations, chat, documents, emails, gmail
│   │   ├── services/ # rag, llm, ingestion, email, gmail
│   │   ├── db/       # SQLAlchemy models + async session
│   │   ├── schemas/  # Pydantic request/response models
│   │   └── core/     # Auth0 JWT validation, exception handlers
│   ├── alembic/      # DB migrations (pgvector, all tables, updated_at trigger)
│   └── tests/        # pytest integration tests
└── frontend/         # React application
    └── src/
        ├── lib/      # API client (axios), Auth context
        ├── store/    # Zustand stores (conversations, clients, documents, emails)
        ├── components/
        │   ├── chat/    # ChatWindow, MessageBubble, InputBar, ModelSelector, EmailCompose
        │   └── sidebar/ # Sidebar, ConversationHistory, FilesPanel, EmailPanel
        └── pages/    # Login, Chat
```

## Getting started

### Backend

```bash
cd backend
cp .env.example .env        # fill in your credentials
pip install -r requirements.txt
alembic upgrade head         # run migrations
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env        # fill in Auth0 + API URL
npm install
npm run dev
```

### Environment variables

**Backend** (`.env`):
```
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.legalai.app/
OPENAI_API_KEY=sk-...        # embeddings
TOGETHER_API_KEY=...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=...
FRONTEND_URL=...
```

**Frontend** (`.env`):
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_AUDIENCE=...
VITE_API_URL=...
```

### Running tests

```bash
cd backend
pip install -r requirements-test.txt
pytest
```
