from pydantic import BaseModel
from typing import List, Optional


class SubjectSchema(BaseModel):
    name: str
    books: List[str]


class AuthorSchema(BaseModel):
    key: str
    name: Optional[str]
    birth_date: Optional[str]
    bio: Optional[str]
    photo_id: Optional[int]
    books: List[str]


class BookSchema(BaseModel):
    work_key: str
    title: str
    authors: List[str]
    subjects: List[str]
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    publisher: Optional[str]
    description: Optional[str] = None
