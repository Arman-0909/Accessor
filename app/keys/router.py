from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, delete
from typing import List
import secrets

from app.database import get_session
from app.models import APIKey, User, UsageLog
from app.schemas import APIKeyCreate, APIKeyResponse, APIKeyUpdate
from app.deps import get_current_user

router = APIRouter(prefix="/keys", tags=["keys"])

def generate_api_key() -> str:
    return "acc-" + secrets.token_urlsafe(32)

@router.post("/", response_model=APIKeyResponse)
def create_api_key(key_in: APIKeyCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    new_key = APIKey(
        name=key_in.name,
        key=generate_api_key(),
        is_active=True,
        rate_limit=key_in.rate_limit,
        expires_at=key_in.expires_at,
        user_id=current_user.id
    )
    session.add(new_key)
    session.commit()
    session.refresh(new_key)
    return new_key

@router.get("/", response_model=List[APIKeyResponse])
def list_api_keys(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    keys = session.exec(select(APIKey).where(APIKey.user_id == current_user.id)).all()
    return keys

@router.put("/{key_id}", response_model=APIKeyResponse)
def update_api_key(key_id: int, key_in: APIKeyUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    key = session.get(APIKey, key_id)
    if not key or key.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="API Key not found")
    
    update_data = key_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(key, k, v)
        
    session.add(key)
    session.commit()
    session.refresh(key)
    return key

@router.delete("/{key_id}")
def delete_api_key(key_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    key = session.get(APIKey, key_id)
    if not key or key.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="API Key not found")
    
    # Cascade delete logs
    session.exec(delete(UsageLog).where(UsageLog.api_key_id == key_id))
    
    session.delete(key)
    session.commit()
    return {"message": "API Key deleted successfully"}
