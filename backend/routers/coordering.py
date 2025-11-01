# backend/routers/coordering.py
from fastapi import APIRouter, Depends
import duckdb
from backend.database import get_con

router = APIRouter(prefix="/coordering", tags=["coordering"])

@router.get("/top-pairs")
def get_top_coordered(limit: int = 50, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    df = con.execute("""
        SELECT
            r1.nombre AS test1,
            r2.nombre AS test2,
            COUNT(*) AS co_occurrences
        FROM results r1
        JOIN results r2 ON r1.numorden = r2.numorden AND r1.Date = r2.Date
        WHERE r1.nombre < r2.nombre
        GROUP BY test1, test2
        ORDER BY co_occurrences DESC
        LIMIT ?
    """, [limit]).fetchdf()
    return df.to_dict(orient="records")