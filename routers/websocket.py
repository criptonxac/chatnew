import json
from db import get_db
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from auth.auth import get_current_user_ws
from models import User, Conversation, ConversationParticipant, Message
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException

router = APIRouter(
    prefix="/ws",
    tags=["WebSocket"]
)


class ConnectionManager:
    def __init__(self):
       
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = {}
        self.active_connections[conversation_id][user_id] = websocket
    
    def disconnect(self, conversation_id: int, user_id: int):
        if conversation_id in self.active_connections:
            if user_id in self.active_connections[conversation_id]:
                del self.active_connections[conversation_id][user_id]
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
    
    async def send_personal_message(self, message: dict, conversation_id: int, user_id: int):
        if conversation_id in self.active_connections and user_id in self.active_connections[conversation_id]:
            await self.active_connections[conversation_id][user_id].send_json(message)
    
    async def broadcast(self, message: dict, conversation_id: int, sender_id: Optional[int] = None):
        if conversation_id in self.active_connections:
            for user_id, connection in self.active_connections[conversation_id].items():
                if sender_id is None or user_id != sender_id: 
                    await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/chat/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str,
    db: Session = Depends(get_db)
):
   
    try:
        current_user = await get_current_user_ws(token, db)
    except HTTPException:
        await websocket.close(code=1008) 
        return
    
  
    conversation = db.query(Conversation)\
        .join(ConversationParticipant)\
        .filter(
            Conversation.id == conversation_id,
            ConversationParticipant.user_id == current_user.id
        ).first()
    
    if not conversation:
        await websocket.close(code=1003)  
        return
    
   
    await manager.connect(websocket, conversation_id, current_user.id)
    
    try:
      
        await manager.broadcast(
            {
                "type": "system",
                "content": f"{current_user.name} suhbatga qo'shildi",
                "sender_id": None,
                "timestamp": str(datetime.utcnow())
            },
            conversation_id
        )
        
        while True:
          
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
           
            new_message = Message(
                conversation_id=conversation_id,
                sender_id=current_user.id,
                content=message_data.get("content", ""),
                is_read=False
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            
           
            await manager.broadcast(
                {
                    "type": "message",
                    "id": new_message.id,
                    "content": new_message.content,
                    "sender_id": current_user.id,
                    "sender_name": current_user.name,
                    "timestamp": str(new_message.timestamp)
                },
                conversation_id,
                current_user.id
            )
            
           
            await manager.send_personal_message(
                {
                    "type": "message_sent",
                    "id": new_message.id,
                    "content": new_message.content,
                    "timestamp": str(new_message.timestamp)
                },
                conversation_id,
                current_user.id
            )
            
    except WebSocketDisconnect:
        
        manager.disconnect(conversation_id, current_user.id)
        await manager.broadcast(
            {
                "type": "system",
                "content": f"{current_user.name} suhbatni tark etdi",
                "sender_id": None,
                "timestamp": str(datetime.utcnow())
            },
            conversation_id
        )
