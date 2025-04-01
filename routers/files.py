import os
import uuid
import shutil
from db import get_db
from models import User
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from auth.auth import get_current_user
from fastapi.responses import FileResponse
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fayl yuklash"""
    try:
   
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
     
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
       
        file_url = f"/api/files/download/{unique_filename}"
        
        return {
            "file_url": file_url,
            "file_name": file.filename,
            "file_type": file.content_type,
            "uploaded_at": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fayl yuklashda xatolik: {str(e)}"
        )
    finally:
        file.file.close()

@router.get("/download/{filename}")
async def download_file(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Faylni yuklab olish"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fayl topilmadi"
        )
    
    return FileResponse(file_path)
