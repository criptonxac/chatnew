import crud
from db import get_db
from models import User
from sqlalchemy.orm import Session
from auth.auth import router as auth
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from schemas import TokenResponse, UserCreate, UserResponse

router = APIRouter()

# router.include_router(auth, prefix="/auth", tags=["Auth"])


@router.post("/users/" ,response_model=UserResponse)
def create_new_user(user:UserCreate, db:Session = Depends(get_db)):
    existing_user = db.quary(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email allaqachon ruyxatdan o'tgan")
    
    return crud.create_user(db=db, user=user)

@router.get("/users/", response_model=list[UserResponse])
def read_users(db: Session = Depends(get_db)):
    return crud.get_users(db=db)


@router.get("/users/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_excisting_user(user_id:int, user:UserCreate, db:Session = Depends(get_db)):
    updated_user = crud.update_user(db=db, user_id=user_id, user=user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.delete("/users/{user_id}", response_model=UserResponse)
def delete_user(user_id:int , db:Session = Depends(get_db)):
    deleted_user = crud.delete_user(db=db, user_id= user_id )
    if not deleted_user:
        raise HTTPException(status_code=404, detail="User not found")
    return deleted_user
