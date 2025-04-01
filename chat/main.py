from db import create_tables
import uvicorn
from fastapi import FastAPI
from auth.auth import router as auth
from default_router import api_router
from routers.chat import router as chat
from routers.files import router as files
from routers.websocket import router as websocket
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Chat App API",
    description="WebSocket va JWT bilan FastAPI asosida chat",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Chat API ishga tushdi. /docs manziliga o'ting"}

app.include_router(auth, prefix="/auth", tags=["Auth"])
app.include_router(websocket)
app.include_router(chat, prefix="/api", tags=["Chat"])
app.include_router(files, prefix="/api", tags=["Files"])
app.include_router(api_router, prefix="/api", tags=["Default"])



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)