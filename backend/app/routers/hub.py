"""Public portfolio data and administrative publication of project videos."""

import json
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Body, Depends, HTTPException, Response
from PIL import Image, ImageOps
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from sqlalchemy import delete, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import ProjectCover, ProjectVideo, PublishedNote
from app.security import admin_session_expiration, get_current_user

router = APIRouter(prefix="/hub", tags=["hub"])
_data_dir = Path(__file__).resolve().parents[1] / "data"
PROFILE = json.loads((_data_dir / "profile.json").read_text(encoding="utf-8"))
JOB_FAIR = json.loads((_data_dir / "job_fair.json").read_text(encoding="utf-8"))
COMPANIES = {company["id"]: company for company in JOB_FAIR["companies"]}
PORTFOLIO_PROJECTS = {project["id"] for project in PROFILE["projects"]}
VideoProject = Literal[
    "nicolas-hub", "gestoriq", "elan", "corner", "mensageria", "recora", "ia"
]
VideoID = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_-]{11}$")]


class ProjectVideoInput(BaseModel):
    project: VideoProject
    video_id: VideoID


NoteID = Annotated[
    str, StringConstraints(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
]


class PublicNote(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    id: NoteID
    folder_id: NoteID
    folder_name: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=120)
    tags: str = Field(max_length=160)
    body: str = Field(min_length=1, max_length=12000)


@router.get("/notes", response_model=list[PublicNote])
def get_public_notes(db: Annotated[Session, Depends(get_db)]) -> list[PublishedNote]:
    return list(
        db.scalars(
            select(PublishedNote).order_by(
                PublishedNote.folder_name, PublishedNote.title
            )
        )
    )


@router.post(
    "/notes",
    response_model=PublicNote,
    dependencies=[Depends(admin_session_expiration), Depends(get_current_user)],
)
def publish_note(
    payload: PublicNote, db: Annotated[Session, Depends(get_db)]
) -> PublicNote:
    db.execute(
        text("""
        INSERT INTO published_notes (id, folder_id, folder_name, title, tags, body)
        VALUES (:id, :folder_id, :folder_name, :title, :tags, :body)
        ON CONFLICT (id) DO UPDATE SET folder_id = EXCLUDED.folder_id,
        folder_name = EXCLUDED.folder_name, title = EXCLUDED.title,
        tags = EXCLUDED.tags, body = EXCLUDED.body
    """),
        payload.model_dump(),
    )
    db.commit()
    return payload


@router.delete(
    "/notes/{note_id}",
    status_code=204,
    dependencies=[Depends(admin_session_expiration), Depends(get_current_user)],
)
def unpublish_note(
    note_id: NoteID, db: Annotated[Session, Depends(get_db)]
) -> Response:
    note = db.get(PublishedNote, note_id)
    if note is not None:
        db.delete(note)
        db.commit()
    return Response(status_code=204)


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


@router.delete(
    "/project-videos/{project}/{video_id}",
    status_code=204,
    dependencies=[Depends(admin_session_expiration), Depends(get_current_user)],
)
def remove_project_video(
    project: VideoProject,
    video_id: VideoID,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    db.execute(
        delete(ProjectVideo).where(
            ProjectVideo.project == project, ProjectVideo.video_id == video_id
        )
    )
    db.commit()
    return Response(status_code=204)


@router.get("/project-covers")
def list_project_covers(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    return dict(db.execute(select(ProjectCover.project, ProjectCover.revision)).all())


@router.get("/project-covers/{project}")
def get_project_cover(
    project: str, db: Annotated[Session, Depends(get_db)]
) -> Response:
    cover = db.get(ProjectCover, project) if project in PORTFOLIO_PROJECTS else None
    if cover is None:
        raise HTTPException(404, "Capa não encontrada.")
    return Response(
        cover.image,
        media_type="image/webp",
        headers={
            "Cache-Control": "public, max-age=300",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.put(
    "/project-covers/{project}",
    dependencies=[Depends(admin_session_expiration), Depends(get_current_user)],
)
def publish_project_cover(
    project: str,
    body: Annotated[bytes, Body(media_type="application/octet-stream")],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    if project not in PORTFOLIO_PROJECTS:
        raise HTTPException(404, "Projeto não encontrado.")
    output = BytesIO()
    try:
        with Image.open(BytesIO(body), formats=["PNG", "JPEG", "WEBP"]) as source:
            if max(source.size) > 4096 or source.width * source.height > 12_000_000:
                raise HTTPException(
                    422, "A capa deve ter até 4096 pixels por lado e 12 megapixels."
                )
            if getattr(source, "is_animated", False):
                raise HTTPException(422, "Escolha uma imagem estática para a capa.")
            oriented = ImageOps.exif_transpose(source)
            oriented.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
            oriented.convert("RGB").save(
                output, format="WEBP", quality=86, exif=b"", icc_profile=b""
            )
    except (OSError, ValueError, SyntaxError, Image.DecompressionBombError) as error:
        raise HTTPException(
            422, "Envie uma imagem PNG, JPEG ou WebP válida."
        ) from error
    image = output.getvalue()
    revision = sha256(image).hexdigest()[:20]
    db.execute(
        text("""
            INSERT INTO project_covers (project, revision, image)
            VALUES (:project, :revision, :image)
            ON CONFLICT (project) DO UPDATE
            SET revision = EXCLUDED.revision, image = EXCLUDED.image
            """),
        {"project": project, "revision": revision, "image": image},
    )
    db.commit()
    return {"project": project, "revision": revision}
