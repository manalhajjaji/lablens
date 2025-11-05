# backend/routers/stats.py
from fastapi import APIRouter, Depends
import duckdb
from backend.database import get_con
from backend.schemas import StatsSummary
import pandas as pd

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/summary", response_model=StatsSummary)
def get_summary(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    result = con.execute("""
        SELECT
            COUNT(*) as total_rows,
            COUNT(DISTINCT numorden) as total_patients,
            COUNT(DISTINCT nombre) as total_tests,
            MIN(Date) as min_date,
            MAX(Date) as max_date,
            AVG(edad) as avg_age,
            SUM(CASE WHEN edad IS NULL THEN 1 ELSE 0 END) as missing_edad
        FROM results
    """).fetchone()

    return StatsSummary(
        total_rows=result[0],
        total_patients=result[1],
        total_tests=result[2],
        date_range=[result[3], result[4]],
        avg_age=round(result[5], 2) if result[5] else None,
        missing_edad=result[6]
    )

@router.get("/test/{test_name}")
def get_test_stats(test_name: str, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    df = con.execute("""
        SELECT textores, COUNT(*) as count
        FROM results
        WHERE nombre = ?
        GROUP BY textores
        ORDER BY count DESC
    """, [test_name]).fetchdf()

    if df.empty:
        return {"error": "Test not found"}

    # Try numeric conversion
    try:
        df['numeric'] = pd.to_numeric(df['textores'], errors='coerce')
        numeric = df[df['numeric'].notna(), ['numeric', 'count']]
        summary = {
            "mean": numeric['numeric'].mean(),
            "std": numeric['numeric'].std(),
            "p25": numeric['numeric'].quantile(0.25),
            "p50": numeric['numeric'].quantile(0.50),
            "p75": numeric['numeric'].quantile(0.75),
            "count": len(numeric)
        } if not numeric.empty else None
    except:
        summary = None

    return {
        "test": test_name,
        "total": df['count'].sum(),
        "values": df[['textores', 'count']].to_dict(orient="records"),
        "numeric_summary": summary
    }