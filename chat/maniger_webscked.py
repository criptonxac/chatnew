from typing import Dict
from fastapi import HTTPException, WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] ={}
    
    async def connection(self, username: str , websocket:WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket
    
    
    def disconnect(self, username:str):
        if username in self.active_connections:
            del self.active_connections[username]
        
    async def broafcasting(self, message:str):
         for connection in self.active_connections.values():
            await connection.send_text(message)

    def get_active_users(self):
        return list(self.active_connections.keys())

manager = ConnectionManager()
    
    