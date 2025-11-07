# backend/models.py
from sqlmodel import SQLModel, Field, Session, create_engine, select
from datetime import datetime
from typing import Optional
import uuid
from enum import Enum
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jwt import PyJWTError as JWTError, encode as jwt_encode, decode as jwt_decode
from datetime import timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

# === CONFIG ===
engine = create_engine("sqlite:///data/cohort_views.db", echo=False)
security = HTTPBearer()

SECRET_KEY = "change-this-in-production-1234567890"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# === MODELS ===
class CohortView(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    filter_json: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    is_public: bool = Field(default=False)

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    action: str
    resource_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[str] = None

# === ARGON2 ===
pwd_context = PasswordHasher()

def verify_password(plain_password, hashed_password):
    try:
        pwd_context.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

# === JWT ===
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt_encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# === SESSION (DÉFINI AVANT) ===
def get_session():
    with Session(engine) as session:
        yield session

# === USER BY USERNAME (MAINTENANT OK) ===
def get_user_by_username(username: str, session: Session):
    return session.exec(select(User).where(User.username == username)).first()

# === CURRENT USER ===
def get_current_user(token: str = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt_decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Créer une session locale
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if not user:
            raise credentials_exception
        return user

# === ADMIN & INIT ===
def create_admin_user(session: Session):
    existing = session.exec(select(User).where(User.username == "admin")).first()
    if existing:
        return  # ← Évite doublon

    password = "admin123"
    hashed = get_password_hash(password)
    admin = User(username="admin", hashed_password=hashed, role=UserRole.ADMIN)
    session.add(admin)
    session.commit()

def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        create_admin_user(s)