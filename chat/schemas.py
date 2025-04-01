from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True



class RoleCreate(BaseModel):
    user_id: int
    description: Optional[str] = None


class RoleResponse(BaseModel):
    id: int
    user_id: int
    description: Optional[str]

    class Config:
        orm_mode = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

    class Config:
        orm_mode = True


class RefreshTokenResponse(BaseModel):
    user_id: int
    refresh_token: str

    class Config:
        orm_mode = True



class ConversationCreate(BaseModel):
    name: Optional[str] = None
    is_group: bool = False
    participant_ids: list[int] = []


class ConversationResponse(BaseModel):
    id: int
    name: Optional[str]
    is_group: bool
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True



class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    timestamp: datetime
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None

    class Config:
        orm_mode = True
