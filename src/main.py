from fastapi import FastAPI
from tortoise import Tortoise
from src.database import init_orm, init_db
from src.routers import books, authors, subjects, signin_signup, favorite_books, recommendation, rating_books, comment_books
from src.auth import *
from src.middleware import track_user_activity
from src.crud.recommendation_crud import get_book_embeddings, get_book_map_and_embedding_list, build_faiss_index

app = FastAPI()

#@app.on_event("startup")
#async def startup_event():
#    await get_book_embeddings()
#    await get_book_map_and_embedding_list()
#    await build_faiss_index()
    # await init_db() # Uncomment this line if you want to initialize the database on startup


@app.on_event("shutdown")
async def shutdown_event():
    await Tortoise.close_connections()

init_orm(app)

app.include_router(signin_signup.router,
                   prefix='/authentication', tags=['authentication'])
app.include_router(books.router, prefix='/books',
                   tags=['books'], dependencies=[Depends(oauth2_scheme_non_required)])
app.include_router(authors.router, prefix='/authors',
                   tags=['authors'], dependencies=[Depends(oauth2_scheme_non_required)])
app.include_router(subjects.router, prefix='/subjects',
                   tags=['subjects'], dependencies=[Depends(oauth2_scheme_non_required)])
app.include_router(favorite_books.router, prefix='/favourite',
                   tags=['favorites'], dependencies=[Depends(oauth2_scheme)])
app.include_router(rating_books.router, prefix='/rating',
                   tags=['ratings'], dependencies=[Depends(oauth2_scheme)])
app.include_router(comment_books.router, prefix='/comment',
                   tags=['comments'], dependencies=[Depends(oauth2_scheme)])
app.include_router(recommendation.router,
                   prefix='/recommendations', tags=['recommendations'])

app.middleware("http")(track_user_activity)

# CORS middleware 
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

