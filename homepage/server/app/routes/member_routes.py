from typing import List
from fastapi import APIRouter
from app.models import Member
from app.db import members_db

router = APIRouter()

@router.get("/", response_model=List[Member])
def list_members():
    docs = list(members_db.find())
    for d in docs:
        d["_id"] = str(d["_id"])

    # 정렬 기준 정의
    order = ["교수", "수석연구위원", "연구위원", "대학원 과정", "연구원", "선임연구원"]
    order_map = {section: idx for idx, section in enumerate(order)}

    # 정렬
    docs.sort(key=lambda d: order_map.get(d.get('section'), len(order_map)))
    return docs
