from db import Base
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean


class BaseModel(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(BaseModel):
    __tablename__ = "users"
    
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    
 
    roles = relationship("UserRole", back_populates="user")


class Role(BaseModel):
    __tablename__ = "roles"
    
    name = Column(String, unique=True, nullable=False)
    description = Column(String)

    user_roles = relationship("UserRole", back_populates="role")


class UserRole(BaseModel):
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey('users.id'))
    role_id = Column(Integer, ForeignKey('roles.id'))

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="user_roles")


class Token(BaseModel):
    __tablename__ = "tokens"
    
    user_id = Column(Integer, ForeignKey('users.id'))
    token = Column(String, unique=True)


class RefreshToken(BaseModel):
    __tablename__ = "refresh_tokens"
    
    user_id = Column(Integer, ForeignKey('users.id'))
    refresh_token = Column(String, unique=True)
    

class Conversation(BaseModel):
    __tablename__ = "conversations"
    
    name = Column(String, nullable=True)
    is_group = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey('users.id'))
    
    creator = relationship("User", foreign_keys=[created_by])
    messages = relationship("Message", back_populates="conversation")
    participants = relationship("ConversationParticipant", back_populates="conversation")

class ConversationParticipant(BaseModel):
    __tablename__ = "conversation_participants"
    
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")

class Message(BaseModel):
    __tablename__ = "messages"
    
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    sender_id = Column(Integer, ForeignKey('users.id'))
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    

print("xamma modellar yaratildi")