from fastapi import FastAPI, HTTPException, Request
from tortoise import Tortoise
from src.database import init_orm, init_db
from src.routers import books, signin_signup
from src.auth import *
from src.models import UserActivity
import uuid

app = FastAPI()

# Only use this when first create the schemas, else disable
# @app.on_event("startup")
# async def startup_event():
#     await init_db()


@app.on_event("shutdown")
async def shutdown_event():
    await Tortoise.close_connections()

init_orm(app)

app.include_router(books.router, prefix='/books', tags=['books'])
app.include_router(signin_signup.router, prefix='/authentication', tags=['authentication'])

# Debug: In ra danh sách route
for route in app.routes:
    print(f"Path: {route.path}, Methods: {route.methods}")

@app.middleware("http")
async def track_user_activity(request: Request, call_next):
    print("Middleware triggered")

    tracking_id = request.cookies.get("tracking_id")
    if not tracking_id:
        tracking_id = str(uuid.uuid4())

    user_id, username = None, None
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    print(f"Token: {token}")

    if token:
        try:
            user = await get_current_user(token=token)
            user_id = user.user_id
            username = user.username
            print(f"User: {username}, ID: {user_id}")
        except HTTPException as e:
            print(f"Auth failed: {e.detail}")

    await UserActivity.create(tracking_id=tracking_id, user_id=user_id, username=username, path=request.url.path)

    response = await call_next(request)
    response.set_cookie(
        key="tracking_id",
        value=tracking_id,  
        httponly=True,        # Prevent JavaScript access (security)
        max_age=30*24*60*60,        # Cookie lasts 30 days
        samesite="lax",     # CSRF protection
    )
    return response