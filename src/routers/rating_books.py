from fastapi import APIRouter, HTTPException, Depends
from src.models import Rating, User
from src.auth import get_current_user
from src.schemas import RateRequest
from tortoise.exceptions import DoesNotExist

router = APIRouter()

@router.post("/books/{book_id}/rate")
async def rate_book(book_id: str, data: RateRequest, user: User = Depends(get_current_user)):
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


@router.get("/books/{book_id}/ratings-summary-and-average")
async def ratings_summary_and_average(book_id: str):
    ratings = await Rating.filter(book_id=book_id).values("score")
    if not ratings:
        raise HTTPException(status_code=404, detail="No ratings found for this book")

    summary = {i: 0 for i in range(1, 6)}
    for r in ratings:
        summary[r["score"]] += 1

    result = await Rating.filter(book_id=book_id).all()
    if not result:
        raise HTTPException(status_code=404, detail="No ratings found for this book")
    
    average_score = sum(r.score for r in result) / len(result) if result else 0
    return {
        "rating_summary": summary,
        "rating_average": round(average_score, 2)
    }
