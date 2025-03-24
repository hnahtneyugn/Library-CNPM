from fastapi import APIRouter, HTTPException
from src.crud import books_crud

router = APIRouter()

@router.get('/fetch-data')
async def fetch_and_save(subject: str, limit: int = 100):
    try:
        await books_crud.save_books_by_subject(subject=subject, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {'message': 'Books saved succesfully!'}
