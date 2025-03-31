from fastapi import APIRouter, HTTPException, Depends
from src.models import User, Book, FavoriteBook
from src.auth import get_current_user
from src.schemas import BookSchema, FavoriteBooksResponse

router = APIRouter()

@router.post("/favorite/add/{book_id}")
async def add_favorite_book(book_id: str, current_user: User = Depends(get_current_user)):
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    favorite, created = await FavoriteBook.get_or_create(user=current_user, book=book)
    if not created:
        raise HTTPException(status_code=400, detail="Book is already in favorites")

    return {"message": "Book added to favorites", "book_id": book.work_key}

@router.delete("/favorite/remove/{book_id}")
async def remove_favorite_book(book_id: str, current_user: User = Depends(get_current_user)):
    deleted_count = await FavoriteBook.filter(user_id=current_user.user_id, book_id=book_id).delete()
    
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found in favorites")
    
    return {"message": "Book removed from favorites", "book_id": book_id}

@router.get("/favorite/list", response_model=FavoriteBooksResponse)
async def list_favorite_books(current_user: User = Depends(get_current_user)):
    favorites = await FavoriteBook.filter(user_id=current_user.user_id).select_related("book")

    books = [
        BookSchema(
            work_key=fav.book.work_key,
            title=fav.book.title,
            cover_id=fav.book.cover_id,
            first_publish_year=fav.book.first_publish_year,
            views=fav.book.views
        ) 
        for fav in favorites if fav.book
    ]

    return FavoriteBooksResponse(user_id=current_user.user_id, favorite_books=books)
