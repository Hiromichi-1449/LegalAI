"""switch chat models to llama and gemma

Revision ID: 004
Revises: 003
Create Date: 2026-06-08
"""
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None

LLAMA_DEFAULT = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
LLAMA_FAST = "meta-llama/Meta-Llama-3-8B-Instruct-Lite"
GEMMA_LARGE = "google/gemma-4-31B-it"


def upgrade() -> None:
    op.alter_column("users", "preferred_model", server_default=LLAMA_DEFAULT)
    op.execute(
        "UPDATE users SET preferred_model = "
        "CASE "
        f"WHEN preferred_model IN ('gpt-5.4', 'gpt-5.5-turbo', 'claude-sonnet-4-6') THEN '{LLAMA_DEFAULT}' "
        f"WHEN preferred_model IN ('gpt-5.4-mini', 'claude-haiku-4-5-20251001') THEN '{LLAMA_FAST}' "
        f"WHEN preferred_model = 'claude-opus-4-6' THEN '{GEMMA_LARGE}' "
        "ELSE preferred_model "
        "END"
    )


def downgrade() -> None:
    op.alter_column("users", "preferred_model", server_default="gpt-5.4")
    op.execute(
        "UPDATE users SET preferred_model = "
        "CASE "
        f"WHEN preferred_model IN ('{LLAMA_DEFAULT}', '{GEMMA_LARGE}') THEN 'gpt-5.4' "
        f"WHEN preferred_model = '{LLAMA_FAST}' THEN 'gpt-5.4-mini' "
        "ELSE preferred_model "
        "END"
    )
