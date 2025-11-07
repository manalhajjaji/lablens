# backend/routers/cohorts.py
from fastapi import APIRouter, Depends, Query
import duckdb
from typing import List
from backend.database import get_con
from backend.schemas import CohortFilter, CohortQueryResponse, CohortRow
from backend.utils.filter_dsl import build_where_clause
from backend.models import get_current_user, User

router = APIRouter(prefix="/cohorts", tags=["cohorts"])

@router.post(
    "/query",
    response_model=CohortQueryResponse,
    summary="Query cohort with filters",
    description="**Requires:** USER or ADMIN role. Returns filtered patient data.",
    tags=["cohorts"]
)
def query_cohort(
    filt: CohortFilter,
    current_user: User = Depends(get_current_user),  # ← AJOUTER ICI
    con: duckdb.DuckDBPyConnection = Depends(get_con),
    limit: int = Query(100, ge=1, le=5_000),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("Date", regex="^(numorden|sexo|edad|nombre|textores|nombre2|Date)$"),
    order: str = Query("DESC", regex="^(ASC|DESC)$"),
):
    where_sql, params = build_where_clause(filt.conditions, filt.logic)

    # Compter les lignes filtrées
    count_q = f"SELECT COUNT(*) FROM results WHERE {where_sql}"
    total_filtered = con.execute(count_q, params).fetchone()[0]

    # Requête paginée
    query = f"""
        SELECT *
        FROM results
        WHERE {where_sql}
        ORDER BY {sort_by} {order}
        LIMIT ? OFFSET ?
    """
    df = con.execute(query, params + [limit, offset]).fetchdf()

    # Total global
    total_all = con.execute("SELECT COUNT(*) FROM results").fetchone()[0]

    # Convertir Date en string
    data_list = []
    for row in df.to_dict(orient="records"):
        row["Date"] = str(row["Date"])
        data_list.append(CohortRow(**row))

    return CohortQueryResponse(
        data=data_list,
        total=total_all,
        filtered=total_filtered,
    )