import duckdb
from fastapi import APIRouter, Depends
from pathlib import Path
from backend.database import get_con
from backend.schemas import PanelResponse
import numpy as np # On importe numpy pour gérer les types si besoin, ou on utilise list()

router = APIRouter(prefix="/panels", tags=["panels"])
PANELS_PATH = Path("data/processed/panels.parquet")

def get_source():
    if not PANELS_PATH.exists():
        return None
    return f"'{PANELS_PATH.as_posix()}'"

@router.get("/patient/{numorden}", response_model=list[PanelResponse])
def get_patient_panels(numorden: str, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    if not src: return []
    
    # 1. Requête SQL
    # On ajoute CAST(numorden AS VARCHAR) pour éviter les conflits int/str
    df = con.execute(f"""
        SELECT 
            CAST(numorden AS VARCHAR) as numorden, 
            Date, 
            n_tests, 
            tests_list
        FROM read_parquet({src})
        WHERE CAST(numorden AS VARCHAR) = ?
        ORDER BY Date
    """, [str(numorden)]).fetchdf()
    
    # 2. CORRECTION CRITIQUE : Conversion Numpy Array -> Python List
    # La colonne 'tests_list' est souvent un numpy.ndarray, ce qui fait planter JSON
    if not df.empty and 'tests_list' in df.columns:
        # On applique list() sur chaque élément pour le convertir en liste Python pure
        df['tests_list'] = df['tests_list'].apply(lambda x: x.tolist() if hasattr(x, 'tolist') else list(x) if x is not None else [])

    return df.to_dict(orient="records")

@router.get("/summary")
def get_panels_summary(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    if not src: return {}

    result = con.execute(f"""
        SELECT 
            COUNT(DISTINCT numorden) as total_patients_with_panels,
            AVG(n_tests) as avg_tests_per_panel,
            MIN(n_tests) as min_tests,
            MAX(n_tests) as max_tests,
            COUNT(*) as total_panels
        FROM read_parquet({src})
    """).fetchone()
    
    distribution = con.execute(f"""
        SELECT n_tests, COUNT(*) as count
        FROM read_parquet({src})
        GROUP BY n_tests
        ORDER BY n_tests
    """).fetchdf()
    
    return {
        "total_patients_with_panels": result[0],
        "avg_tests_per_panel": round(result[1], 2) if result[1] else 0,
        "min_tests": result[2],
        "max_tests": result[3],
        "total_panels": result[4],
        "distribution": distribution.to_dict(orient="records")
    }

@router.get("/top-patients")
def get_top_patients(limit: int = 20, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    if not src: return []

    df = con.execute(f"""
        SELECT 
            CAST(numorden AS VARCHAR) as numorden,
            COUNT(*) as panel_count,
            SUM(n_tests) as total_tests,
            AVG(n_tests) as avg_tests_per_panel
        FROM read_parquet({src})
        GROUP BY numorden
        ORDER BY panel_count DESC
        LIMIT ?
    """, [limit]).fetchdf()
    
    return df.to_dict(orient="records")