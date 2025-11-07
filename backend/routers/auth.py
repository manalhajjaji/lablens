# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Form, status
from sqlmodel import Session, select
from typing import List
from backend.models import (
    get_user_by_username,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_session,
    AuditLog,
    get_current_user,
    User,
    UserRole
)
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    """
    Authentifie un utilisateur et retourne un JWT token.
    
    Credentials par défaut:
    - username: admin
    - password: admin123
    """
    user = get_user_by_username(username, session)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role
    }

@router.get("/audit/logs", response_model=List[AuditLog])
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Récupère les logs d'audit.
    
    **Requires:** ADMIN role
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    logs = session.exec(
        select(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(1000)
    ).all()
    
    return logs