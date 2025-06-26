from fastapi import APIRouter, HTTPException
from app.db import papers_db

router = APIRouter()

@router.get("/")
def list_papers():
    docs = list(papers_db.find())  # 모든 문서 가져오기
    for d in docs:
        d.pop("_id", None)  # Mongo의 ObjectId 제거
    return docs  # 연도별 하나의 문서가 담긴 리스트 반환
