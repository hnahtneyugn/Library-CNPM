from fastapi import APIRouter, HTTPException, Depends
from src.models import Comment, User, CommentLike
from src.auth import get_current_user
from src.schemas import CommentRequest
from tortoise.exceptions import DoesNotExist

router = APIRouter()

@router.post("/books/{book_id}/comments")
async def add_comment(book_id: str, data: CommentRequest, user: User = Depends(get_current_user)):
    comment = await Comment.create(book_id=book_id, user_id=user.user_id, content=data.content)
    return {"message": "Comment added", "id": comment.comment_id}


@router.post("/books/{book_id}/comments/{comment_id}/replies")
async def reply_comment(comment_id: int, data: CommentRequest, user: User = Depends(get_current_user)):
    try:
        parent = await Comment.get(comment_id=comment_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    reply = await Comment.create(book_id=parent.book_id, user_id=user.user_id, content=data.content, parent=parent)
    return {"message": "Reply added", "id": reply.comment_id}


@router.get("/books/{book_id}/comments")
async def get_comments(book_id: str):
    comments = await Comment.filter(book_id=book_id, parent=None).prefetch_related("replies", "user")
    return comments


@router.get("/books/{book_id}/comments/replies")
async def get_replies(comment_id: int):
    comments = await Comment.filter(parent_id=comment_id).prefetch_related("replies", "user")
    return comments


@router.post("/comments/{comment_id}/like")
async def like_or_dislike_comment(comment_id: int, is_like: int, user: User = Depends(get_current_user)):
    if is_like not in [1, -1, 0]:
        raise HTTPException(status_code=400, detail="The status is invalid")
    
    existing_like = await CommentLike.filter(comment_id=comment_id, user=user).first()
    
    if existing_like:
        if is_like == 0:
            await existing_like.delete()
        else:
            existing_like.is_like = is_like
            await existing_like.save()
    else:
        await CommentLike.create(comment_id=comment_id, user_id=user.user_id, is_like=is_like)
    
    return {"message": "The comment status has been successfully updated."}


@router.get("/comments/{comment_id}/likes_count")
async def get_comment_like_count(comment_id: int):
    likes_count = await CommentLike.filter(comment_id=comment_id, is_like=1).count()
    dislikes_count = await CommentLike.filter(comment_id=comment_id, is_like=-1).count()
    
    return {"likes_count": likes_count, "dislikes_count": dislikes_count}





