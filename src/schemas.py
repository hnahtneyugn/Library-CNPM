from pydantic import BaseModel
from typing import List, Optional


class SubjectSchema(BaseModel):
    name: str

    class Config:
        from_attributes = True


class AuthorSchema(BaseModel):
    key: str
    name: Optional[str]

    class Config:
        from_attributes = True


class BookSchema(BaseModel):
    work_key: str
    title: str
    authors: Optional[List[str]]
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    views: int = 0

    class Config:
        from_attributes = True


class BookDetailsSchema(BaseModel):
    work_key: str
    title: str
    authors: List[str]
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    views: int
    subjects: Optional[List[str]]
    description: Optional[str]
    publishers: Optional[List[str]]
    publish_date: Optional[str]
    contributions: Optional[List[str]]
    number_of_pages: Optional[int]

    class Config:
        from_attributes = True
