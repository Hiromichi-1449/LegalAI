"""add splunk_alerts table

Revision ID: 003
Revises: 002
Create Date: 2026-05-19
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "splunk_alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("firm_id", UUID(as_uuid=True), sa.ForeignKey("firms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("alert_name", sa.String(), nullable=False),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("splunk_search_id", sa.String(), nullable=True),
        sa.Column("risk_score", sa.Float(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_splunk_alerts_firm_id", "splunk_alerts", ["firm_id"])
    op.create_index("ix_splunk_alerts_received_at", "splunk_alerts", ["received_at"])


def downgrade() -> None:
    op.drop_index("ix_splunk_alerts_received_at", table_name="splunk_alerts")
    op.drop_index("ix_splunk_alerts_firm_id", table_name="splunk_alerts")
    op.drop_table("splunk_alerts")
