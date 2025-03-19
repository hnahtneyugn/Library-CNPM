from fastapi import FastAPI
from tortoise import Tortoise
from src.database import init_orm, init_db
from src.routers import books

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

# Debug: In ra danh sách route
for route in app.routes:
    print(f"Path: {route.path}, Methods: {route.methods}")
