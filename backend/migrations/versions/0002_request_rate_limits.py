"""Persist request quotas across API instances."""

import sqlalchemy as sa
from alembic import op

revision = "0002_request_rate_limits"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "request_rate_limits",
        sa.Column("bucket", sa.String(100), primary_key=True),
        sa.Column("window_id", sa.BigInteger, nullable=False),
        sa.Column("hits", sa.Integer, nullable=False),
    )
    op.create_index(
        "ix_request_rate_limits_window_id", "request_rate_limits", ["window_id"]
    )


def downgrade() -> None:
    op.drop_table("request_rate_limits")
