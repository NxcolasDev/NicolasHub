"""Read-only portfolio and Job Fair data curated from local source documents."""

import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/hub", tags=["hub"])
_data_dir = Path(__file__).resolve().parents[1] / "data"
PROFILE = json.loads((_data_dir / "profile.json").read_text(encoding="utf-8"))
JOB_FAIR = json.loads((_data_dir / "job_fair.json").read_text(encoding="utf-8"))
COMPANIES = {company["id"]: company for company in JOB_FAIR["companies"]}


@router.get("/profile")
def get_profile() -> dict:
    return PROFILE


@router.get("/job-fair")
def get_job_fair() -> dict:
    return JOB_FAIR
