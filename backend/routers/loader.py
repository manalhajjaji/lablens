import shutil
import subprocess
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from backend.database import get_con
from backend import schemas
from backend.utils.filter_dsl import build_where_clause
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import duckdb

router = APIRouter(prefix="/loader", tags=["loader"])

# === CHEMINS ===
DATA_DIR = Path("data")
RAW_PATH = DATA_DIR / "raw" / "original_synthetic_bloodwork.csv"
CLEAN_PATH = DATA_DIR / "cleaned" / "cleaned_bloodwork.csv"
PARQUET_PATH = DATA_DIR / "processed" / "results.parquet"
PANELS_PATH = DATA_DIR / "processed" / "panels.parquet"
REPEATS_PATH = DATA_DIR / "processed" / "repeats.parquet"
CLEAN_SCRIPT = Path("scripts/02_clean_data.py")

# Création structure
for p in [DATA_DIR / "raw", DATA_DIR / "cleaned", DATA_DIR / "processed"]:
    p.mkdir(parents=True, exist_ok=True)

def _generate_derived_tables(con):
    """
    Génère les fichiers Parquet dérivés (Panels et Repeats).
    Version Robuste : Gère plusieurs formats de dates.
    """
    print("🔄 Génération des tables dérivées...")
    
    # Expression magique : essaie DD/MM/YYYY, sinon YYYY-MM-DD, sinon DD-MM-YYYY
    # C'est vital pour que DuckDB ne renvoie pas NULL si le format change
    date_parser = "COALESCE(try_strptime(Date, '%d/%m/%Y'), try_strptime(Date, '%Y-%m-%d'), try_strptime(Date, '%d-%m-%Y'))"

    try:
        # 1. PANELS
        con.execute(f"""
            COPY (
                SELECT 
                    numorden, 
                    Date, 
                    COUNT(*) as n_tests, 
                    list(nombre) as tests_list
                FROM results
                GROUP BY numorden, Date
            ) TO '{PANELS_PATH.as_posix()}' (FORMAT 'parquet');
        """)
        print("✅ Panels générés.")

        # 2. REPEATS
        # On parse la date proprement, puis on la reformate uniformément en DD/MM/YYYY pour l'affichage
        con.execute(f"""
            COPY (
                SELECT 
                    numorden, 
                    nombre, 
                    COUNT(*) as repeat_count,
                    MIN({date_parser}) as first_date_obj,
                    MAX({date_parser}) as last_date_obj,
                    date_diff('day', MIN({date_parser}), MAX({date_parser})) as days_span,
                    strftime(MIN({date_parser}), '%d/%m/%Y') as first_date,
                    strftime(MAX({date_parser}), '%d/%m/%Y') as last_date
                FROM results
                GROUP BY numorden, nombre
                HAVING count(*) > 1
            ) TO '{REPEATS_PATH.as_posix()}' (FORMAT 'parquet');
        """)
        print("✅ Répétitions générées.")
        
    except Exception as e:
        print(f"⚠️ Erreur dérivation : {e}")
        raise e

def _load_parquet_to_duckdb(con):
    if not PARQUET_PATH.exists(): return
    con.execute(f"CREATE OR REPLACE TABLE results AS SELECT * FROM read_parquet('{PARQUET_PATH.as_posix()}')")
    
    # Indexation légère
    cols = ["numorden", "nombre", "nombre2", "Date", "sexo"]
    existing = [c[1] for c in con.execute("PRAGMA table_info(results)").fetchall()]
    for col in cols:
        if col in existing:
            try: 
                con.execute(f"CREATE INDEX IF NOT EXISTS idx_{col} ON results ({col})")
            except: pass

@router.post("/upload_file", response_model=schemas.UploadResponse)
async def upload_file(file: UploadFile = File(...), con=Depends(get_con)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSV requis.")

    try:
        with open(RAW_PATH, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    # Nettoyage
    if CLEAN_SCRIPT.exists():
        subprocess.run(["python", str(CLEAN_SCRIPT)], capture_output=True, check=False)
    else:
        shutil.copy(RAW_PATH, CLEAN_PATH)

    if not CLEAN_PATH.exists():
        raise HTTPException(500, "Echec nettoyage.")

    # Conversion & Génération
    try:
        df = pd.read_csv(CLEAN_PATH)
        # Conversion des colonnes objets en string pour éviter les soucis PyArrow
        for col in df.select_dtypes(['object']).columns:
            df[col] = df[col].astype(str)
            
        table = pa.Table.from_pandas(df)
        pq.write_table(table, PARQUET_PATH)
        
        _load_parquet_to_duckdb(con)
        _generate_derived_tables(con) # C'est ici que la magie opère
        
    except Exception as e:
        raise HTTPException(500, f"Erreur traitement : {str(e)}")

    return {
        "rows": len(df),
        "message": "Succès",
        "filename": file.filename,
        "clean_csv_path": str(CLEAN_PATH)
    }

# Subset (minimaliste pour ne pas casser le fichier)
@router.post("/subset", response_model=schemas.SubsetResponse)
def subset(filters: schemas.CohortFilter, limit: int = Query(1000), con=Depends(get_con)):
    if PARQUET_PATH.exists():
        try: con.execute("SELECT 1 FROM results LIMIT 1")
        except: _load_parquet_to_duckdb(con)
    
    where_clause, params = build_where_clause(filters.conditions, filters.logic)
    query = f"SELECT * FROM results WHERE {where_clause} LIMIT {limit}"
    df = con.execute(query, params).fetchdf()
    count = con.execute(f"SELECT COUNT(*) FROM results WHERE {where_clause}", params).fetchone()[0]
    return {"rowcount": count, "records": df.to_dict(orient="records")}