from fastapi import APIRouter, HTTPException, Depends
from src.models import User, Book, FavoriteBook
from src.auth import get_current_user
from src.schemas import BookSchema, FavoriteBooksSchema

router = APIRouter()


@router.post("/favorites/{book_id}")
async def add_favorite_book(book_id: str, current_user: User = Depends(get_current_user)):
    '''
    Add a book to the user's favorites list.
    If the book is not found, return an error.
    If the book is already in the favorites list, return an error.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    favorite, created = await FavoriteBook.get_or_create(user=current_user, book_id=book_id)
    if not created:
        raise HTTPException(
            status_code=400, detail="Book is already in favorites")

    return {"message": "Book added to favorites", "book_id": book_id}


@router.delete("/favorites/{book_id}")
async def remove_favorite_book(book_id: str, current_user: User = Depends   (get_current_user)):
    '''
    Remove a book from the user's favorites list.
    If the book is not found, return an error.
    If the book is not in the favorites list, return an error.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    deleted_count = await FavoriteBook.filter(user_id=current_user.user_id, book_id=book_id).delete()

    if deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Book not found in favorites")

    return {"message": "Book removed from favorites", "book_id": book_id}


@router.get("/favorites", response_model=FavoriteBooksSchema)
async def list_favorite_books(current_user: User = Depends(get_current_user)):
    '''
    List all favorite books of the user.
    If the user has no favorite books, return an empty list.
    '''
    favorites = await FavoriteBook.filter(user_id=current_user.user_id).select_related("book")
    
    books = [
        BookSchema.from_orm(fav.book)
        for fav in favorites
        if fav.book is not None
    ]

    return {
        "user_id": current_user.user_id,
        "favorite_books": books
    }