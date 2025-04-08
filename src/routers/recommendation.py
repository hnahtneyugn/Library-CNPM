from fastapi import APIRouter, HTTPException, Depends
from src.models import User, Book
from src.auth import get_current_user
from src.schemas import BookSchema
from src.crud.recommendation_crud import recommend_books, create_book_embedding
from typing import List

router = APIRouter()


@router.get("/", response_model=List[BookSchema])
async def get_recommendations(current_user: User = Depends(get_current_user)):
    """Get book recommendations for a user.

    Args:
        current_user (str): The currently logged-in user.
    Returns:
        list[BookSchema]: A list of recommended books.
    """

    # Call the recommendation function from the CRUD module
    recommendations = await recommend_books(current_user.username)
    if not recommendations:
        raise HTTPException(status_code=404, detail="No recommendations found")
    return [BookSchema(**book) for book in recommendations]


@router.get("/fetch-embedding")
async def fetch_book_embedding(fetch_all: bool = False):
    """Fetch the embedding for a specific book.

    Returns:
        dict: A dictionary containing the book's embedding.
    """
    # Fetch the book embedding from the database
    if fetch_all:
        books = await Book.all()
        for book in books:
            await create_book_embedding(book.work_key)
    else:
        book = await Book.all().limit(1)
        await create_book_embedding(book[0].work_key)

    return {'Successfully fetched book embedding'}
