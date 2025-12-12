from fastapi import APIRouter, Depends, HTTPException
import duckdb
from pathlib import Path
from backend.database import get_con
from backend.schemas import StatsSummary, TestStatsResponse, TestNumericSummary

router = APIRouter(prefix="/stats", tags=["stats"])
RESULTS_PATH = Path("data/processed/results.parquet")

def get_source():
    if not RESULTS_PATH.exists():
        raise HTTPException(status_code=400, detail="Données manquantes.")
    return f"'{RESULTS_PATH.as_posix()}'"

# DATE PARSER ROBUSTE
DATE_EXPR = "COALESCE(try_strptime(Date, '%d/%m/%Y'), try_strptime(Date, '%Y-%m-%d'), try_strptime(Date, '%d-%m-%Y'))"

@router.get("/summary", response_model=StatsSummary)
def get_summary(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    
    query = f"""
        SELECT
            COUNT(*) AS total_rows,
            COUNT(DISTINCT numorden) AS total_patients,
            COUNT(DISTINCT nombre) AS total_tests,
            MIN({DATE_EXPR}) AS min_date_obj,
            MAX({DATE_EXPR}) AS max_date_obj,
            AVG(edad) AS avg_age,
            SUM(CASE WHEN edad IS NULL THEN 1 ELSE 0 END) AS missing_edad
        FROM read_parquet({src})
    """
    result = con.execute(query).fetchone()
    
    min_d = result[3].strftime('%d/%m/%Y') if result[3] else None
    max_d = result[4].strftime('%d/%m/%Y') if result[4] else None

    try:
        total_services = con.execute(f"SELECT COUNT(DISTINCT nombre2) FROM read_parquet({src}) WHERE nombre2 IS NOT NULL").fetchone()[0]
    except: total_services = 0

    return StatsSummary(
        total_rows=result[0],
        total_patients=result[1],
        total_tests=result[2],
        avg_age=round(result[5], 2) if result[5] else None,
        missing_edad=result[6],
        date_range=[min_d, max_d],
        total_services=total_services  
    )

@router.get("/activity-trend")
def get_activity_trend(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    try:
        df = con.execute(f"""
            SELECT 
                STRFTIME({DATE_EXPR}, '%Y-%m') AS month,
                COUNT(*) AS total_tests
            FROM read_parquet({src})
            WHERE {DATE_EXPR} IS NOT NULL
            GROUP BY month
            ORDER BY month
        """).fetchdf()
        return df.to_dict(orient="records")
    except: return []

@router.get("/by-sex")
def get_stats_by_sex(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    df = con.execute(f"SELECT sexo, COUNT(DISTINCT numorden) as patients FROM read_parquet({src}) GROUP BY sexo").fetchdf()
    return df.to_dict(orient="records")

@router.get("/by-service")
def get_stats_by_service(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    df = con.execute(f"SELECT nombre2 as service, COUNT(*) as test_count FROM read_parquet({src}) WHERE nombre2 IS NOT NULL GROUP BY nombre2 ORDER BY test_count DESC LIMIT 20").fetchdf()
    return df.to_dict(orient="records")

@router.get("/test/{test_name}", response_model=TestStatsResponse)
def get_test_details(test_name: str, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    clean_name = test_name.strip()
    
    exists = con.execute(f"SELECT COUNT(*) FROM read_parquet({src}) WHERE nombre ILIKE ?", [clean_name]).fetchone()[0]
    if exists == 0: return TestStatsResponse(test=clean_name, values=[], error="Test introuvable")

    try:
        values_df = con.execute(f"""
            SELECT CAST(textores AS VARCHAR) as textores, COUNT(*) as count
            FROM read_parquet({src})
            WHERE nombre ILIKE ? AND textores IS NOT NULL
            GROUP BY textores
            ORDER BY count DESC LIMIT 50
        """, [clean_name]).fetchdf()
        
        stats = con.execute(f"""
            SELECT
                AVG(TRY_CAST(textores AS DOUBLE)) as mean,
                STDDEV(TRY_CAST(textores AS DOUBLE)) as std,
                QUANTILE_CONT(TRY_CAST(textores AS DOUBLE), 0.25) as p25,
                QUANTILE_CONT(TRY_CAST(textores AS DOUBLE), 0.50) as p50,
                QUANTILE_CONT(TRY_CAST(textores AS DOUBLE), 0.75) as p75,
                COUNT(TRY_CAST(textores AS DOUBLE)) as count
            FROM read_parquet({src})
            WHERE nombre ILIKE ?
        """, [clean_name]).fetchone()
        
        num_sum = None
        if stats and stats[5] > 0: 
            num_sum = TestNumericSummary(mean=stats[0] or 0, std=stats[1] or 0, p25=stats[2] or 0, p50=stats[3] or 0, p75=stats[4] or 0)

        return TestStatsResponse(test=clean_name, numeric_summary=num_sum, values=values_df.to_dict(orient="records"))

    except Exception as e:
        return TestStatsResponse(test=clean_name, values=[], error=str(e))