from fastapi import APIRouter, HTTPException
from app.models import Member, News
from app.db import members_db, news_db

router = APIRouter()

@router.post("/member", response_model=Member)
def upsert_member(member: Member):
    member_data = member.dict(by_alias=True)

    # upsert로 update_one
    result = members_db.update_one(
        {"name": member.name},   # 이름을 기준 필터
        {"$set": member_data},   # 이 필드들로 업데이트
        upsert=True
    )

    # 문서 조회하기
    new_member = members_db.find_one({"name": member.name})
    if not new_member:
        raise HTTPException(status_code=500, detail="Member upsert failed")

    new_member["_id"] = str(new_member["_id"])  # ObjectId -> str
    return new_member

@router.post("/news", response_model=News)
def upsert_news(news: News):
    news_data = news.dict(by_alias=True)
    
    # upsert로 update_one
    result = news_db.update_one(
        {"date": news.date},   # 이름을 기준 필터
        {"$set": news_data},   # 이 필드들로 업데이트
        upsert=True
    )

    # 문서 조회하기
    new_news = news_db.find_one({"date": news.date})
    if not new_news:
        raise HTTPException(status_code=500, detail="News upsert failed")

    new_news["_id"] = str(new_news["_id"])  # ObjectId -> str
    return new_news
