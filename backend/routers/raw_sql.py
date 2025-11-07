# backend/routers/raw_sql.py
from fastapi import APIRouter, Depends, HTTPException
import duckdb
from backend.database import get_con
from pydantic import BaseModel
from backend.models import AuditLog, get_current_user, User, get_session
from sqlmodel import Session

router = APIRouter(prefix="/raw", tags=["raw-sql"])

class RawSQLRequest(BaseModel):
    sql: str

ALLOWED_PREFIXES = ("SELECT", "WITH")

@router.post("/execute")
def raw_sql(
    req: RawSQLRequest,
    current_user: User = Depends(get_current_user),
    con: duckdb.DuckDBPyConnection = Depends(get_con),
    session: Session = Depends(get_session)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    sql = req.sql.strip().upper()
    if not any(sql.startswith(p) for p in ALLOWED_PREFIXES):
        raise HTTPException(400, detail="Only SELECT/WITH queries allowed")

    try:
        df = con.execute(req.sql).fetchdf()

        audit = AuditLog(
            user_id=current_user.username,
            action="execute_sql",
            details=req.sql[:200]
        )
        session.add(audit)
        session.commit()

        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(400, detail=str(e))