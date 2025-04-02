from fastapi import APIRouter, HTTPException, Query
from src.openlibrary_service import fetch_author_details
from src.crud import books_crud
from src.schemas import AuthorDetailsSchema, BookSchema
from typing import List

router = APIRouter()


@router.get('/{key}', response_model=AuthorDetailsSchema)
async def get_author_details(key: str):
    author_details = await fetch_author_details(key=key)
    author_details = AuthorDetailsSchema(**author_details)
    return author_details


@router.get('/{key}/books', response_model=List[BookSchema])
async def get_books_of_author(key: str, offset: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=100)):
    books = await books_crud.get_books_by_author(key=key, offset=offset, limit=limit)
    return books
