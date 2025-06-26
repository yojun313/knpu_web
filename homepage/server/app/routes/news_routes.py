from fastapi import APIRouter
from app.db import news_db

router = APIRouter()

@router.get("/")
def list_news():
    docs = list(news_db.find())
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs
