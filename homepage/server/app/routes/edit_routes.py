from fastapi import APIRouter, HTTPException
from app.models import Member, News, Paper
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
def upsert_paper(paper: Paper, year: int):
    paper_data = paper.dict(by_alias=True)
    year_str = str(year)

    # 연도로 문서 찾기
    existing_doc = papers_db.find_one({"year": year_str})

    if not existing_doc:
        # 연도 문서가 없으면 새 문서 생성
        papers_db.insert_one({"year": year_str, "papers": [paper_data]})
        return paper_data

    # 연도의 논문 리스트
    papers_for_year = existing_doc.get("papers", [])
    updated = False

    # 같은 title 있으면 교체
    for i, p in enumerate(papers_for_year):
        if p.get("title") == paper_data["title"]:
            papers_for_year[i] = paper_data
            updated = True
            break

    # 없으면 새로 추가
    if not updated:
        papers_for_year.append(paper_data)

    # MongoDB 문서 업데이트
    papers_db.update_one(
        {"year": year_str},
        {"$set": {"papers": papers_for_year}},
    )

    return paper_data
