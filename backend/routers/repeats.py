# backend/routers/repeats.py
import duckdb
from fastapi import APIRouter, Depends
from backend.database import get_con
from backend.schemas import RepeatResponse

router = APIRouter(prefix="/repeats", tags=["repeats"])

@router.get("/patient/{numorden}", response_model=list[RepeatResponse])
def get_patient_repeats(numorden: str, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    df = con.execute("""
        SELECT numorden, nombre, repeat_count, first_date, last_date, days_span
        FROM repeats
        WHERE numorden = ?
        ORDER BY repeat_count DESC
    """, [numorden]).fetchdf()
    return df.to_dict(orient="records")