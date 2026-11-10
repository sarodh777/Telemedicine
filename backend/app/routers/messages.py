from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.message import Message
from backend.app.schemas.message import MessageCreate, MessageResponse, MessageBatchSync
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messaging"])

@router.post("", response_model=MessageResponse)
def send_message(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check receiver exists
    receiver = db.query(User).filter(User.id == data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient user not found.")

    # Check deduplication if client_msg_id is provided
    if data.client_msg_id:
        existing = db.query(Message).filter(Message.client_msg_id == data.client_msg_id).first()
        if existing:
            return MessageResponse(
                id=existing.id,
                sender_id=existing.sender_id,
                receiver_id=existing.receiver_id,
                sender_name=existing.sender.full_name if existing.sender else "User",
                receiver_name=existing.receiver.full_name if existing.receiver else "User",
                message_content=existing.message_content,
                delivery_status=existing.delivery_status,
                client_msg_id=existing.client_msg_id,
                created_at=existing.created_at
            )

    msg = Message(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        message_content=data.message_content.strip(),
        delivery_status="delivered",
        client_msg_id=data.client_msg_id
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        sender_name=current_user.full_name,
        receiver_name=receiver.full_name,
        message_content=msg.message_content,
        delivery_status=msg.delivery_status,
        client_msg_id=msg.client_msg_id,
        created_at=msg.created_at
    )

@router.get("/conversations")
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns list of contacts the user has conversed with."""
    user_id = current_user.id
    all_msgs = db.query(Message).filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    contacts_map = {}
    for m in all_msgs:
        other_id = m.receiver_id if m.sender_id == user_id else m.sender_id
        if other_id not in contacts_map:
            other_user = db.query(User).filter(User.id == other_id).first()
            if other_user:
                contacts_map[other_id] = {
                    "other_user_id": other_id,
                    "name": other_user.full_name,
                    "role": other_user.role,
                    "last_message": m.message_content,
                    "last_timestamp": m.created_at,
                    "unread": (m.receiver_id == user_id and m.delivery_status != "read")
                }

    return list(contacts_map.values())

@router.get("/{other_user_id}", response_model=List[MessageResponse])
def get_conversation_history(
    other_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uid = current_user.id
    msgs = db.query(Message).filter(
        or_(
            and_(Message.sender_id == uid, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == uid)
        )
    ).order_by(Message.created_at.asc()).all()

    # Mark incoming as read
    for m in msgs:
        if m.receiver_id == uid and m.delivery_status != "read":
            m.delivery_status = "read"
    db.commit()

    results = []
    for m in msgs:
        results.append(
            MessageResponse(
                id=m.id,
                sender_id=m.sender_id,
                receiver_id=m.receiver_id,
                sender_name=m.sender.full_name if m.sender else "User",
                receiver_name=m.receiver.full_name if m.receiver else "User",
                message_content=m.message_content,
                delivery_status=m.delivery_status,
                client_msg_id=m.client_msg_id,
                created_at=m.created_at
            )
        )
    return results

@router.post("/sync", response_model=List[MessageResponse])
def sync_offline_messages(
    payload: MessageBatchSync,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Automatic synchronization endpoint for offline queued messages.
    Prevents duplicates through client_msg_id.
    """
    synced = []
    for item in payload.messages:
        # Check duplicate
        if item.client_msg_id:
            existing = db.query(Message).filter(Message.client_msg_id == item.client_msg_id).first()
            if existing:
                synced.append(
                    MessageResponse(
                        id=existing.id,
                        sender_id=existing.sender_id,
                        receiver_id=existing.receiver_id,
                        sender_name=existing.sender.full_name if existing.sender else "User",
                        receiver_name=existing.receiver.full_name if existing.receiver else "User",
                        message_content=existing.message_content,
                        delivery_status=existing.delivery_status,
                        client_msg_id=existing.client_msg_id,
                        created_at=existing.created_at
                    )
                )
                continue

        receiver = db.query(User).filter(User.id == item.receiver_id).first()
        if not receiver:
            continue

        new_msg = Message(
            sender_id=current_user.id,
            receiver_id=item.receiver_id,
            message_content=item.message_content.strip(),
            delivery_status="delivered",
            client_msg_id=item.client_msg_id
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        synced.append(
            MessageResponse(
                id=new_msg.id,
                sender_id=new_msg.sender_id,
                receiver_id=new_msg.receiver_id,
                sender_name=current_user.full_name,
                receiver_name=receiver.full_name,
                message_content=new_msg.message_content,
                delivery_status=new_msg.delivery_status,
                client_msg_id=new_msg.client_msg_id,
                created_at=new_msg.created_at
            )
        )
    return synced

