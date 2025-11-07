# backend/routers/cohort_stats.py
from fastapi import APIRouter, Depends
import duckdb
import pandas as pd
from backend.database import get_con
from backend.schemas import CohortFilter
from backend.utils.filter_dsl import build_where_clause
from pydantic import BaseModel
from typing import Any, Dict, Optional
from backend.models import get_current_user, User

router = APIRouter(prefix="/cohorts", tags=["cohort-stats"])

class NumericSummary(BaseModel):
    mean: Optional[float] = None
    std: Optional[float] = None
    p25: Optional[float] = None
    p50: Optional[float] = None
    p75: Optional[float] = None
    count: int

class ColumnStats(BaseModel):
    column: str
    missing: int
    unique: int
    numeric: Optional[NumericSummary] = None
    top_values: Optional[Dict[str, int]] = None   # pour les colonnes texte

class CohortStatsResponse(BaseModel):
    total_rows: int
    columns: list[ColumnStats]

@router.post("/stats", response_model=CohortStatsResponse)
def cohort_stats(filt: CohortFilter,current_user: User = Depends(get_current_user), con: duckdb.DuckDBPyConnection = Depends(get_con)):
    where_sql, params = build_where_clause(filt.conditions, filt.logic)

    # 1. total rows after filter
    total = con.execute(f"SELECT COUNT(*) FROM results WHERE {where_sql}", params).fetchone()[0]

    # 2. stats per column
    stats = []
    for col in ["numorden","sexo","edad","nombre","textores","nombre2","Date"]:
        # missing
        miss = con.execute(f"SELECT COUNT(*) FROM results WHERE {where_sql} AND {col} IS NULL", params).fetchone()[0]

        # unique
        uniq = con.execute(f"SELECT COUNT(DISTINCT {col}) FROM results WHERE {where_sql}", params).fetchone()[0]

        col_stat = ColumnStats(column=col, missing=miss, unique=uniq)

        # numeric ?
        if col in ["edad"]:
            df_num = con.execute(f"SELECT CAST({col} AS DOUBLE) AS val FROM results WHERE {where_sql} AND {col} IS NOT NULL", params).fetchdf()
            if not df_num.empty:
                s = df_num["val"]
                col_stat.numeric = NumericSummary(
                    mean=float(s.mean()),
                    std=float(s.std()),
                    p25=float(s.quantile(0.25)),
                    p50=float(s.quantile(0.50)),
                    p75=float(s.quantile(0.75)),
                    count=len(s),
                )
        # texte top-5
        elif col not in ["Date"]:
            top = con.execute(f"""
                SELECT {col}, COUNT(*) AS cnt
                FROM results
                WHERE {where_sql}
                GROUP BY {col}
                ORDER BY cnt DESC LIMIT 5
            """, params).fetchdf()
            if not top.empty:
                col_stat.top_values = dict(zip(top[col], top["cnt"]))

        stats.append(col_stat)

    return CohortStatsResponse(total_rows=total, columns=stats)