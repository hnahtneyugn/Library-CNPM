from fastapi import APIRouter, HTTPException, Depends
from src.models import Book, Comment, User, CommentLike
from src.auth import get_current_user
from src.schemas import CommentRequest, CommentSchema, CommentLikeSchema

router = APIRouter()

@router.post("/{book_id}/comments")
async def add_comment(book_id: str, data: CommentRequest, user: User = Depends(get_current_user)):
    '''
    Add a comment to a book.
    If the book is not found, return an error.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    comment = await Comment.create(book_id=book_id, user_id=user.user_id, content=data.content)
    return {"message": "Comment added", "id": comment.comment_id}


@router.get("/{book_id}/comments", response_model=CommentSchema)
async def get_comments(book_id: str):
    '''
    Get all comments for a book.
    If the book is not found, return an error.
    If the book has no comments, return an empty list.
    '''
    book = await Book.get_or_none(work_key=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    comments = await Comment.filter(book_id=book_id, parent=None).prefetch_related("replies", "user")
    return comments


@router.post("/{book_id}/comments/{comment_id}/replies")
async def reply_comment(comment_id: int, data: CommentRequest, user: User = Depends(get_current_user)):
    ''' 
    Reply to a comment.
    If the comment is not found, return an error.
    '''
    parent = await Comment.get_or_none(comment_id=comment_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    reply = await Comment.create(book_id=parent.book_id, user_id=user.user_id, content=data.content, parent=parent)
    return {"message": "Reply added", "id": reply.comment_id}


@router.get("/{book_id}/comments/{comment_id}/replies", response_model=CommentSchema)
async def get_replies(comment_id: int):
    '''
    Get all replies to a comment.
    If the comment is not found, return an error.
    If the comment has no replies, return an empty list.
    '''
    parent = await Comment.get_or_none(comment_id=comment_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")

    comments = await Comment.filter(parent_id=comment_id).prefetch_related("replies", "user")
    return comments


@router.delete("/{book_id}/comments/{comment_id}")
async def delete_comment(comment_id: int, user: User = Depends(get_current_user)):
    ''' 
    Delete a comment.
    If the comment is not found, return an error.
    If the comment is not created by the user, return an error.
    If the comment has replies, return an error.
    '''
    comment = await Comment.get_or_none(comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this comment")
    
    await comment.delete()
    return {"message": "Comment deleted"}


@router.post("/{book_id}/comments/{comment_id}/like")
async def like_or_dislike_comment(comment_id: int, is_like: int, user: User = Depends(get_current_user)):
    '''
    Like or dislike a comment.
    If the comment is not found, return an error.
    If the comment is already liked or disliked, update the status.
    If the comment is not liked or disliked, create a new like/dislike.
    If the status is 0, delete the like/dislike.
    '''
    comment = await Comment.get_or_none(comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
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


@router.get("/{book_id}/comments/{comment_id}/like", response_model=CommentLikeSchema)
async def get_comment_like_count(comment_id: int):
    ''' 
    Get the like and dislike count of a comment.
    If the comment is not found, return an error.
    If the comment has no likes or dislikes, return 0.
    '''
    comment = await Comment.get_or_none(comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    likes_count = await CommentLike.filter(comment_id=comment_id, is_like=1).count()
    dislikes_count = await CommentLike.filter(comment_id=comment_id, is_like=-1).count()
    
    return {
        "likes_count": likes_count,
        "dislikes_count": dislikes_count
    }





