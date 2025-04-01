from db import get_db
from typing import List
from sqlalchemy.orm import Session
from auth.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models import User, Conversation, ConversationParticipant, Message
from schemas import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse, UserResponse

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


# Suhbatlar uchun endpointlar
@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yangi suhbat yaratish"""
   
    new_conversation = Conversation(
        name=conversation_data.name,
        is_group=conversation_data.is_group,
        created_by=current_user.id
    )
    db.add(new_conversation)
    db.flush()
    
    
    creator_participant = ConversationParticipant(
        conversation_id=new_conversation.id,
        user_id=current_user.id
    )
    db.add(creator_participant)
    
 
    for user_id in conversation_data.participant_ids:
        if user_id != current_user.id:  
            participant = ConversationParticipant(
                conversation_id=new_conversation.id,
                user_id=user_id
            )
            db.add(participant)
    
    db.commit()
    db.refresh(new_conversation)
    
    return new_conversation


@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Foydalanuvchining barcha suhbatlarini olish"""
    
    user_conversations = db.query(Conversation)\
        .join(ConversationParticipant)\
        .filter(ConversationParticipant.user_id == current_user.id)\
        .all()
    
    return user_conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ma'lum bir suhbat ma'lumotlarini olish"""
   
    conversation = db.query(Conversation)\
        .join(ConversationParticipant)\
        .filter(
            Conversation.id == conversation_id,
            ConversationParticipant.user_id == current_user.id
        ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suhbat topilmadi yoki siz unga kirishga ruxsat yo'q"
        )
    
    return conversation



@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Yangi xabar yuborish"""
   
    conversation = db.query(Conversation)\
        .join(ConversationParticipant)\
        .filter(
            Conversation.id == message_data.conversation_id,
            ConversationParticipant.user_id == current_user.id
        ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suhbat topilmadi yoki siz unga kirishga ruxsat yo'q"
        )
    

    new_message = Message(
        conversation_id=message_data.conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        is_read=False,
        file_url=message_data.file_url,
        file_name=message_data.file_name,
        file_type=message_data.file_type
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ma'lum bir suhbatdagi xabarlarni olish"""
    # Suhbatni tekshirish
    conversation = db.query(Conversation)\
        .join(ConversationParticipant)\
        .filter(
            Conversation.id == conversation_id,
            ConversationParticipant.user_id == current_user.id
        ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suhbat topilmadi yoki siz unga kirishga ruxsat yo'q"
        )
    

    messages = db.query(Message)\
        .filter(Message.conversation_id == conversation_id)\
        .order_by(Message.timestamp.asc())\
        .all()
    
    return messages


@router.get("/users/search", response_model=List[UserResponse])
def search_users(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Foydalanuvchilarni izlash"""
    if not query or len(query) < 2:
        return []
    
    users = db.query(User)\
        .filter(
            User.id != current_user.id,
            User.name.ilike(f"%{query}%") | User.email.ilike(f"%{query}%")
        )\
        .limit(20)\
        .all()
    
    return users
