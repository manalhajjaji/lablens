import duckdb
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends
from pathlib import Path
from backend.database import get_con
from backend.schemas import RepeatResponse

router = APIRouter(prefix="/repeats", tags=["repeats"])
REPEATS_PATH = Path("data/processed/repeats.parquet")

def get_source():
    if not REPEATS_PATH.exists():
        return None
    return f"'{REPEATS_PATH.as_posix()}'"

@router.get("/patient/{numorden}", response_model=list[RepeatResponse])
def get_patient_repeats(numorden: str, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    if not src: return []

    # 1. Requête sécurisée avec CAST pour l'ID
    df = con.execute(f"""
        SELECT 
            CAST(numorden AS VARCHAR) as numorden, 
            nombre, 
            repeat_count, 
            first_date, 
            last_date, 
            days_span
        FROM read_parquet({src})
        WHERE CAST(numorden AS VARCHAR) = ?
        ORDER BY repeat_count DESC
    """, [str(numorden)]).fetchdf()

    # 2. CORRECTION CRITIQUE : Gestion des NaN (Not a Number)
    # Pydantic déteste les NaN pour les champs Int. On les remplace par None.
    if not df.empty:
        df = df.replace({np.nan: None})

    return df.to_dict(orient="records")

@router.get("/summary")
def get_repeats_summary(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    if not src: 
        return {"patients_with_repeats": 0, "tests_repeated": 0, "avg_repeats": 0, "max_repeats": 0}

    result = con.execute(f"""
        SELECT 
            COUNT(DISTINCT numorden) as patients_with_repeats,
            COUNT(DISTINCT nombre) as tests_repeated,
            AVG(repeat_count) as avg_repeats,
            MAX(repeat_count) as max_repeats
        FROM read_parquet({src})
    """).fetchone()
    
    return {
        "patients_with_repeats": result[0],
        "tests_repeated": result[1],
        "avg_repeats": round(result[2], 2) if result[2] else 0,
        "max_repeats": result[3]
    }

@router.get("/top-tests")
def get_top_repeated_tests(limit: int = 20, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    src = get_source()
    if not src: return []

    df = con.execute(f"""
        SELECT 
            nombre,
            COUNT(DISTINCT numorden) as patient_count,
            AVG(repeat_count) as avg_repeats,
            MAX(repeat_count) as max_repeats
        FROM read_parquet({src})
        GROUP BY nombre
        ORDER BY patient_count DESC
        LIMIT ?
    """, [limit]).fetchdf()
    
    return df.to_dict(orient="records")

@router.get("/trend")
def get_repeats_trend(con: duckdb.DuckDBPyConnection = Depends(get_con)):
    """
    Renvoie l'évolution des répétitions dans le temps.
    Correction : Tri chronologique et filtre des valeurs nulles.
    """
    src = get_source()
    if not src: return []

    try:
        # CORRECTION GRAPHE :
        # 1. WHERE first_date IS NOT NULL : Enlève le point "None" géant
        # 2. ORDER BY try_strptime : Trie par vraie date, pas par ordre alphabétique ("01/02" avant "02/01")
        df = con.execute(f"""
            SELECT 
                first_date AS Date,
                SUM(repeat_count) AS total_repeats
            FROM read_parquet({src})
            WHERE first_date IS NOT NULL
            GROUP BY first_date
            ORDER BY try_strptime(first_date, '%d/%m/%Y') ASC
        """).fetchdf()
        
        # Conversion explicite pour éviter tout souci JSON
        df["Date"] = df["Date"].astype(str)
        return df.to_dict(orient="records")
        
    except Exception as e:
        print(f"Trend error: {e}")
        return []