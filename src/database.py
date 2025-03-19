from tortoise import Tortoise, run_async
from tortoise.contrib.fastapi import register_tortoise
from fastapi import FastAPI
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv(
    "DATABASE_URL", "postgres://postgres:Hson2005%40%23@localhost:5432/bookhub")


async def init_db():
    await Tortoise.init(
        db_url=DB_URL,
        modules={"models": ["src.models"]}
    )
    await Tortoise.generate_schemas()


def init_orm(app: FastAPI):
    register_tortoise(
        app,
        db_url=DB_URL,
        modules={"models": ["src.models"]},
        generate_schemas=False,
        add_exception_handlers=True,
    )
