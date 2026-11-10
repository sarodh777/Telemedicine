from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class MessageCreate(BaseModel):
    receiver_id: int
    message_content: str
    client_msg_id: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    message_content: str
    delivery_status: str
    client_msg_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MessageBatchSync(BaseModel):
    messages: List[MessageCreate]

