"""Publish portfolio videos from the shared database."""

import sqlalchemy as sa
from alembic import op

revision = "0003_project_videos"
down_revision = "0002_request_rate_limits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_videos",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("project", sa.String(32), nullable=False),
        sa.Column("video_id", sa.String(11), nullable=False),
        sa.UniqueConstraint("project", "video_id", name="uq_project_videos_project_id"),
    )


def downgrade() -> None:
    op.drop_table("project_videos")
