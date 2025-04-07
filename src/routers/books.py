from fastapi import APIRouter, HTTPException, Query
from src.crud import books_crud
from src.schemas import BookSchema, BookDetailsSchema
from enum import Enum
from typing import List

router = APIRouter()


class OrderBy(str, Enum):
    title = 'title'
    first_publish_year = 'first_publish_year'
    views = 'views'
    work_key = 'work_key'


class Order(str, Enum):
    asc = 'asc'
    desc = 'desc'


@router.get('/fetch-data')
async def fetch_and_save(subject: str, limit: int = 100):
    try:
        await books_crud.save_books_by_subject(subject=subject, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {'message': 'Books saved successfully!'}


@router.get('/', response_model=List[BookSchema])
async def get_books(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, le=500, ge=1),
    order_by: str = Query('OrderBy.title', description='Field to sort by'),
    order: str = Query('Order.asc', description='sort order'),
    search: str = Query(None, description='search query')
):
    books = await books_crud.get_books(offset=offset, limit=limit, order_by=order_by.value, order=order.value, search=search)
    return books

@router.get('/{work_key}', response_model=BookDetailsSchema)
async def get_book_details(work_key: str):
    book = await books_crud.get_book_details(work_key=work_key)
    if not book:
        raise HTTPException(status_code=404, detail='Book not found')
    book = BookDetailsSchema(**book)
    return book
