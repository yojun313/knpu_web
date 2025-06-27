from pydantic import BaseModel
from typing import List

class Member(BaseModel):
    uid: str
    image: str
    name: str
    position: str
    affiliation: str
    section: str
    email: str
    학력: List[str]
    경력: List[str]
    연구: List[str]

class News(BaseModel):
    uid: str
    image: str
    title: str
    content: str
    date: str
    url: str

class Paper(BaseModel):
    uid: str
    title: str
    authors: List[str]
    conference: str
    link: str


class PaperRequest(BaseModel):
    year: int
    paper: Paper