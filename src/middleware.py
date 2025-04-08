from fastapi import HTTPException, Request
from tortoise.expressions import F
from src.auth import *
from src.models import UserActivity, UserBook
import uuid

required_paths = ["favorite", "rating", "comment"]

async def track_user_activity(request: Request, call_next):
    print("Middleware triggered")

    tracking_id = request.cookies.get("tracking_id")
    if not tracking_id:
        tracking_id = str(uuid.uuid4())

    full_path = request.url.path
    path_parts = full_path.strip("/").split("/", 1)  
    prefix = path_parts[0] if path_parts else ""    
    sub_path = path_parts[1] if len(path_parts) > 1 else "" 

    user_id, username = None, None
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    print(f"Token: {token}")

    # paths that require authentication (use get_current_user)
    if prefix in required_paths:
        if token:
            try:
                user = await get_current_user(token=token)
                user_id = user.user_id
                username = user.username
                print(f"User: {username}, ID: {user_id}")
            except HTTPException as e:
                print(f"Auth failed: {e.detail}")
                # Don't raise here; let the endpoint handle the error
        else:
            print("No token provided for required path")

    # paths that don't require authentication (use get_current_user_optional)
    else:
        if token:
            user = await get_current_user_optional(token=token)
            if user:
                user_id = user.user_id
                username = user.username
                print(f"User: {username}, ID: {user_id}")

    # Only log users with credentials
    if username is not None and user_id is not None:
        await UserActivity.create(
            tracking_id=tracking_id,
            user_id=user_id,
            username=username,
            path=request.url.path,
            prefix=prefix,
            sub_path=sub_path
        )

        # Update click times for books recommendation
        if prefix == "books":
            if await UserBook.filter(username=username, bookname=sub_path).exists():
                await UserBook.filter(username=username, bookname=sub_path).update(click_times=F("click_times") + 1)
            else:
                await UserBook.create(username=username, bookname=sub_path, click_times=1)

    response = await call_next(request)
    response.set_cookie(
        key="tracking_id",
        value=tracking_id,  
        httponly=True,        # Prevent JavaScript access (security)
        max_age=30*24*60*60,        # Cookie lasts 30 days
        samesite="lax",     # CSRF protection
    )
    return response