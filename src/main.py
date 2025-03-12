from fastapi import FastAPI
from .routers import fetch_data
import logging

app = FastAPI(title='BookHub API')

logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# include routers
app.include_router(fetch_data.router,
                   prefix='/api/fetch-data', tags=['fetch-data'])
