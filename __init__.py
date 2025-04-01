from db import engine
from models import Base
from main import app
from default_router import api_router


Base.metadata.create_all(bind=engine)


# app.include_router(api_router, prefix="/api", tags=["Default"])
