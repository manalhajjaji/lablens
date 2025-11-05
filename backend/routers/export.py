# backend/routers/export.py
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
import duckdb
import pandas as pd
from io import BytesIO
from backend.database import get_con

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/panels/csv")
def export_panels_csv(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    df = con.execute("SELECT * FROM panels").fetchdf()
    csv = df.to_csv(index=False)
    return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=panels.csv"})

@router.get("/results/excel")
def export_results_excel(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    df = con.execute("SELECT * FROM results LIMIT 10000").fetchdf()  # limit for safety
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Results')
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=results.xlsx"}
    )