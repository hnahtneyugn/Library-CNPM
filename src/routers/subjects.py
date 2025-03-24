from fastapi import APIRouter, HTTPException, Query
from src.crud import books_crud
from src.schemas import BookSchema
from typing import List

router = APIRouter()


@router.get('/{subject}', response_model=List[BookSchema])
async def get_books_by_subject(subject: str, offset: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=100)):
    books = await books_crud.get_books_by_subject(subject=subject, offset=offset, limit=limit)
    return books
