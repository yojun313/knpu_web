from typing import List
from fastapi import APIRouter
from app.models import Member
from app.db import members_db

router = APIRouter()

@router.get("/")
def list_members():
    docs = list(members_db.find())
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

