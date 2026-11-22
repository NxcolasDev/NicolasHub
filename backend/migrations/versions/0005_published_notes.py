"""Store explicitly published notes for visitors."""

import sqlalchemy as sa
from alembic import op

revision = "0005_published_notes"
down_revision = "0004_project_covers"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "published_notes",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("folder_id", sa.String(64), nullable=False),
        sa.Column("folder_name", sa.String(120), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("tags", sa.String(160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("published_notes")
