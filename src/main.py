from fastapi import FastAPI
from tortoise import Tortoise
from src.database import init_orm, init_db
from src.routers import books, authors, subjects, signin_signup, favorite_books, rating_books, comment_books
from src.auth import *
from src.middleware import track_user_activity

app = FastAPI()

# Only use this when first create the schemas, else disable
# @app.on_event("startup")
# async def startup_event():
#     await init_db()


@app.on_event("shutdown")
async def shutdown_event():
    await Tortoise.close_connections()

init_orm(app)

app.include_router(signin_signup.router, prefix='/authentication', tags=['authentication'])
app.include_router(books.router, prefix='/books', tags=['books'], dependencies=[Depends(oauth2_scheme_non_required)])
app.include_router(authors.router, prefix='/authors', tags=['authors'], dependencies=[Depends(oauth2_scheme_non_required)])
app.include_router(subjects.router, prefix='/subjects', tags=['subjects'],dependencies=[Depends(oauth2_scheme_non_required)])
app.include_router(favorite_books.router, prefix='/favorite', tags=['favorite'],dependencies=[Depends(oauth2_scheme)])
app.include_router(rating_books.router, prefix='/rating', tags=['rating'], dependencies=[Depends(oauth2_scheme)])
app.include_router(comment_books.router, prefix='/comment', tags=['comment'],dependencies=[Depends(oauth2_scheme)])

app.middleware("http")(track_user_activity)

# Debug: In ra danh sách route
for route in app.routes:
    print(f"Path: {route.path}, Methods: {route.methods}")
