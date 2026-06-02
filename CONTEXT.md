# LegalAI — Domain Context

## Core Concepts

### LLM Provider
A company whose models are selectable in the model picker. The UI groups models by **model creator** (who built the model), not by infrastructure provider (who serves it). Current providers: OpenAI, Anthropic, Meta, Google, Alibaba, Moonshot.

### Inference Provider
The cloud service that hosts and serves open-weight model inference. LegalAI uses **Together.ai** for all open-source/open-weight models (Meta Llama, Google Gemma, Qwen, Kimi). Together.ai exposes an OpenAI-compatible API, so the backend routes it through the same streaming path as OpenAI.

### Email Sync
The process of pulling a user's connected Gmail inbox into the LegalAI database via the Gmail API. Requires a one-time Google OAuth consent flow. Once connected, "Sync Email" fetches the latest 50 inbox messages and stores them as `Email` records scoped to the user's firm.

### Verification Code
A 6-digit one-time code sent via SendGrid to confirm a user's email address. Used during **Sign Up** (before the account is activated) and mirrors the existing Forgot Password flow. Codes are stored in the DB with an expiry timestamp and invalidated on use.

### Sign Up
A two-step in-app flow on `/signup`:
1. User enters email + password → backend creates the Auth0 user via Management API and sends a Verification Code via SendGrid.
2. User enters the code on a verification screen → backend marks the account verified and redirects to Login.

Deliberately mirrors the Forgot Password pattern so users have a consistent mental model.
