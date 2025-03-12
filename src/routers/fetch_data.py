from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src import crud
from src.database import SessionLocal, Base, engine

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# create table if not exists
Base.metadata.create_all(bind=engine)


@router.get('/fetch-and-save-books-by-subject')
async def fetch_and_save(subject: str, limit: int = 100, db: Session = Depends(get_db)):
    try:
        # Save books by subject
        crud.save_books_by_subject(db, subject=subject, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {'message': 'Books saved successfully!'}
