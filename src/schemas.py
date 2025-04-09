from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime



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
    cover_id: Optional[int]
    first_publish_year: Optional[int]
    views: int = 0

    model_config = {"from_attributes": True}


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


class UserSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=255) # "..." means "required, not optional"
    password: str = Field(..., min_length=8)

    class Config:
        from_attributes = True


class FavoriteBooksSchema(BaseModel):
    user_id: int
    favorite_books: List[BookSchema]

    class Config:
        from_attributes = True

class RateRequest(BaseModel):
    score: int

    class Config:
        from_attributes = True


class RateSummarySchema(BaseModel):
    summary: dict[int, int]
    average_score: float
    total_ratings: int

    class Config:
        from_attributes = True


class CommentRequest(BaseModel):
    content: str

    class config:
        from_attributes = True

class CommentSchema(BaseModel):
    comment_id: int
    book_id: str
    user_id: int
    content: str
    parent_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class CommentLikeSchema(BaseModel):
    likes_count: int
    dislikes_count: int

    class Config:
        from_attributes = True