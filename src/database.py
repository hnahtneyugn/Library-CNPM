from tortoise import Tortoise, run_async
from tortoise.contrib.fastapi import register_tortoise
from fastapi import FastAPI
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")


async def init_db():
    await Tortoise.init(
        db_url=DB_URL,
        modules={"models": ["src.models", "aerich.models"]}
    )
    await Tortoise.generate_schemas()


TORTOISE_ORM = {
    "connections": {"default": DB_URL},
    "apps": {
        "models": {
            "models": ["src.models", "aerich.models"],  # Include aerich.models
            "default_connection": "default",
        }
    }
}


def init_orm(app: FastAPI):
    register_tortoise(
        app,
        config=TORTOISE_ORM,
        generate_schemas=False,
        add_exception_handlers=True,
    )
