# backend/routers/panels.py
import duckdb
from fastapi import APIRouter, Depends
from backend.database import get_con
from backend.schemas import PanelResponse

router = APIRouter(prefix="/panels", tags=["panels"])

@router.get("/patient/{numorden}", response_model=list[PanelResponse])
def get_patient_panels(numorden: str, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    df = con.execute("""
        SELECT numorden, Date, n_tests, tests_list
        FROM panels
        WHERE numorden = ?
        ORDER BY Date
    """, [numorden]).fetchdf()
    return df.to_dict(orient="records")