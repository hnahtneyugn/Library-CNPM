from fastapi import APIRouter, HTTPException, Depends
from src.models import Book, Rating, User
from src.auth import get_current_user
from src.schemas import RateRequest, RateSummarySchema
from tortoise.exceptions import DoesNotExist

router = APIRouter()


@router.post("/{book_id}")
async def rate_book(book_id: str, data: RateRequest, user: User = Depends(get_current_user)):
    '''
    Rate a book.
    If the book is not found, return an error.
    If the score is not between 1 and 5, return an error.
    If the book is already rated by the user, update the rating.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if data.score < 1 or data.score > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    try:
        rating = await Rating.get(book_id=book_id, user_id=user.user_id)
        rating.score = data.score
        await rating.save()
        return {"message": "Rating updated"}
    except DoesNotExist:
        await Rating.create(book_id=book_id, user_id=user.user_id, score=data.score)
        return {"message": "Book rated"}


@router.get("/{book_id}/summary", response_model=RateSummarySchema)
async def ratings_summary_and_average(book_id: str):
    ''' 
    Get the summary and average rating of a book.
    If the book is not found, return an error.
    If the book has no ratings, return 0.
    The summary is a dictionary with keys from 1 to 5 and values as the number of ratings for each score.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    ratings = await Rating.filter(book_id=book_id).values("score")
    if not ratings:
        raise HTTPException(
            status_code=404, detail="No ratings found for this book")

    summary = {i: 0 for i in range(1, 6)}
    for r in ratings:
        summary[r["score"]] += 1

    result = await Rating.filter(book_id=book_id).all()

    average_score = sum(r.score for r in result) / len(result) if result else 0
    return {
        "summary": summary,
        "average_score": round(average_score, 2),
        "total_ratings": len(result)
    }


@router.delete("/{book_id}")
async def delete_rating(book_id: str, user: User = Depends(get_current_user)):
    '''
    Delete a rating for a book.
    If the book is not found, return an error.
    If the rating is not found, return an error.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    deleted_count = await Rating.filter(book_id=book_id, user_id=user.user_id).delete()
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rating not found")

    return {"message": "Rating deleted"}
