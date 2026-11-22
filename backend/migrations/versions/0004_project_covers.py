"""Persist the published cover for each portfolio project."""

import sqlalchemy as sa
from alembic import op

revision = "0004_project_covers"
down_revision = "0003_project_videos"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_covers",
        sa.Column("project", sa.String(32), primary_key=True),
        sa.Column("revision", sa.String(20), nullable=False),
        sa.Column("image", sa.LargeBinary(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("project_covers")
