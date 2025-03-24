from pydantic import BaseModel, Field
from typing import List, Optional


class SubjectSchema(BaseModel):
    name: str

    model_config = {"from_attributes": True}


class AuthorSchema(BaseModel):
    key: str
    name: Optional[str]

    model_config = {"from_attributes": True}


class BookSchema(BaseModel):
    work_key: str
    title: str
    authors: Optional[List[str]]
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    views: int = 0

    model_config = {"from_attributes": True}


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

    model_config = {"from_attributes": True}

class UserSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=255) # "..." means "required, not optional"
    password: str = Field(..., min_length=8)

    model_config = {"from_attributes": True}