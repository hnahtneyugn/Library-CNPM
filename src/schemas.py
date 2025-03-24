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
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    views: int = 0

    class Config:
        from_attributes = True


class BookDetailsSchema(BaseModel):
    work_key: str
    title: str
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    views: int
    authors: List[AuthorSchema]
    description: Optional[str]
    subjects: List[str]
    isbn: Optional[List[str]]
    publishers: Optional[List[str]]
    source_records: Optional[List[str]]
    edition_key: Optional[str]
    number_of_pages: Optional[int]
    ratings: Optional[dict]

    class Config:
        from_attributes = True


class AuthorDetailsSchema(BaseModel):
    personal_name: str
    birth_date: str
    links: Optional[List]
    alternate_names: Optional[List[str]]
    name: Optional[str]
    bio: Optional[str]
    photos: Optional[List[int]]
    source_records: Optional[List[str]]
