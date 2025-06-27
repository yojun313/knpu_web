from fastapi import APIRouter, HTTPException
from app.db import papers_db

router = APIRouter()

@router.get("/")
def list_papers():
    docs = list(papers_db.find())  # 모든 문서 가져오기
    for d in docs:
        d.pop("_id", None)  # Mongo의 ObjectId 제거

    # 연도 기준 내림차순 정렬
    docs.sort(key=lambda x: int(x.get("year", 0)), reverse=True)

    return docs

