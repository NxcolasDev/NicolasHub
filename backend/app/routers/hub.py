"""Public portfolio data and administrative publication of project videos."""

import json
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import ProjectVideo
from app.security import admin_session_expiration, get_current_user

router = APIRouter(prefix="/hub", tags=["hub"])
_data_dir = Path(__file__).resolve().parents[1] / "data"
PROFILE = json.loads((_data_dir / "profile.json").read_text(encoding="utf-8"))
JOB_FAIR = json.loads((_data_dir / "job_fair.json").read_text(encoding="utf-8"))
COMPANIES = {company["id"]: company for company in JOB_FAIR["companies"]}
VideoProject = Literal["nicolas-hub", "gestoriq", "elan", "corner", "mensageria", "ia"]


class ProjectVideoInput(BaseModel):
    project: VideoProject
    video_id: str = Field(min_length=11, max_length=11, pattern=r"^[A-Za-z0-9_-]+$")


@router.get("/profile")
def get_profile() -> dict:
    return PROFILE


@router.get("/job-fair")
def get_job_fair() -> dict:
    return JOB_FAIR


@router.get("/project-videos")
def list_project_videos(
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, list[str]]:
    library: dict[str, list[str]] = {}
    for video in db.scalars(select(ProjectVideo).order_by(ProjectVideo.id)):
        library.setdefault(video.project, []).append(video.video_id)
    return library


@router.post(
    "/project-videos",
    dependencies=[Depends(admin_session_expiration), Depends(get_current_user)],
)
def publish_project_video(
    payload: ProjectVideoInput, db: Annotated[Session, Depends(get_db)]
) -> ProjectVideoInput:
    existing = select(ProjectVideo.id).where(
        ProjectVideo.project == payload.project,
        ProjectVideo.video_id == payload.video_id,
    )
    if db.scalar(existing) is None:
        db.add(ProjectVideo(project=payload.project, video_id=payload.video_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if db.scalar(existing) is None:
                raise
    return payload
