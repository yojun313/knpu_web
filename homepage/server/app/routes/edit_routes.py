from fastapi import APIRouter, HTTPException
from app.models import Member, News, Paper, PaperRequest
from app.db import members_db, news_db, papers_db

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

@router.post("/paper", response_model=Paper)
def upsert_paper(request: PaperRequest):
    year_str = str(request.year)
    paper_data = request.paper.dict(by_alias=True)

    existing_doc = papers_db.find_one({"year": year_str})

    if not existing_doc:
        papers_db.insert_one({"year": year_str, "papers": [paper_data]})
        return paper_data

    papers_for_year = existing_doc.get("papers", [])
    updated = False
    for i, p in enumerate(papers_for_year):
        if p.get("title") == paper_data["title"]:
            papers_for_year[i] = paper_data
            updated = True
            break

    if not updated:
        papers_for_year.append(paper_data)

    papers_db.update_one(
        {"year": year_str},
        {"$set": {"papers": papers_for_year}},
    )

    return paper_data

