from tortoise import Tortoise, run_async
from faker import Faker
from passlib.context import CryptContext
from models import User
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

TORTOISE_ORM = {
    "connections": {
        "default": DB_URL
    },
    "apps": {
        "models": {
            "models": ["models"],
            "default_connection": "default",
        }
    }
}

fake = Faker()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def populate_users():
    await Tortoise.init(config=TORTOISE_ORM)
    print("Connected to database")

    for i in range(200):
        username = fake.user_name()
        # Ensure username is unique by adding a number if needed
        while await User.filter(username=username).exists():
            username = f"{fake.user_name()}{fake.random_int(1, 1000)}"

        password = fake.password(length=12)
        hashed_password = pwd_context.hash(password)

        await User.create(username=username, hashed_password=hashed_password)
        if (i + 1) % 50 == 0:
            print(f"Created {i + 1} users so far...")

    user_count = await User.all().count()
    print(f"Total users in database: {user_count}")

    await Tortoise.close_connections()

if __name__ == "__main__":
    run_async(populate_users())
