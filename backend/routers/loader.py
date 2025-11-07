# backend/routers/loader.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from typing import List
from backend.database import get_con
from backend import schemas
from backend.utils.filter_dsl import build_where_clause
import pandas as pd
from pathlib import Path
import pyarrow as pa
import pyarrow.parquet as pq
import duckdb
import io
import subprocess  # ✅ pour exécuter le script externe

router = APIRouter(prefix="/loader", tags=["loader"])

# === Paths ===
EXPECTED_COLS = ["numorden", "sexo", "edad", "nombre", "textores", "nombre2", "Date"]
RAW_CSV_PATH = Path("data/raw/original_synthetic_bloodwork.csv")
CLEAN_CSV_PATH = Path("data/cleaned/cleaned_bloodwork.csv")
PARQUET_RESULTS_PATH = Path("data/processed/results.parquet")
CLEAN_SCRIPT_PATH = Path("scripts/02_clean_data.py")

Path("data/processed").mkdir(parents=True, exist_ok=True)
Path("data/cleaned").mkdir(parents=True, exist_ok=True)


def _write_to_duckdb_and_parquet(df: pd.DataFrame, con):
    """Écrit le dataframe en Parquet + crée la table DuckDB"""
    table = pa.Table.from_pandas(df, preserve_index=False)
    pq.write_table(table, PARQUET_RESULTS_PATH, compression="snappy", use_dictionary=True)

    con.execute(f"""
        CREATE OR REPLACE TABLE results AS
        SELECT * FROM read_parquet('{PARQUET_RESULTS_PATH.as_posix()}')
    """)

    for col in ["numorden", "nombre", "nombre2", "Date"]:
        try:
            con.execute(f"CREATE INDEX IF NOT EXISTS idx_{col} ON results ({col})")
        except Exception:
            pass


# === ROUTE 1 : Upload Local ===
@router.post("/upload_local", response_model=schemas.UploadResponse)
def upload_local(con=Depends(get_con)):
    """
    🔹 Étape 1 : Appelle le script clean_data.py pour nettoyer les données.
    🔹 Étape 2 : Charge le fichier nettoyé dans DuckDB.
    """
    if not RAW_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail=f"Fichier brut non trouvé : {RAW_CSV_PATH}")

    if not CLEAN_SCRIPT_PATH.exists():
        raise HTTPException(status_code=500, detail=f"Script de nettoyage introuvable : {CLEAN_SCRIPT_PATH}")

    # Étape 1 — Exécution du script de nettoyage
    try:
        subprocess.run(["python", str(CLEAN_SCRIPT_PATH)], check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'exécution de clean_data.py : {e}")

    # Vérifier que le fichier nettoyé existe
    if not CLEAN_CSV_PATH.exists():
        raise HTTPException(status_code=500, detail="Le fichier nettoyé n'a pas été généré par clean_data.py")

    # Étape 2 — Lecture du CSV nettoyé
    try:
        df = pd.read_csv(CLEAN_CSV_PATH, encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la lecture du fichier nettoyé : {e}")

    # Étape 3 — Enregistrement dans DuckDB
    _write_to_duckdb_and_parquet(df, con)

    return {
        "rows": len(df),
        "message": f"✅ Fichier nettoyé chargé avec succès ({len(df)} lignes). Table `results` mise à jour.",
        "clean_csv_path": str(CLEAN_CSV_PATH)
    }


# === ROUTE 2 : Upload via navigateur ===
@router.post("/upload_file", response_model=schemas.UploadResponse)
def upload_file(file: UploadFile = File(...), con=Depends(get_con)):
    """
    Permet d'uploader un fichier CSV depuis le navigateur.
    Nettoie, valide et crée la table 'results' dans DuckDB.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content), encoding="latin1")
        df.to_csv(RAW_CSV_PATH, index=False, encoding="utf-8")  # Sauvegarde temporaire
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier : {e}")

    # Appelle clean_data.py pour nettoyer ce nouveau fichier
    try:
        subprocess.run(["python", str(CLEAN_SCRIPT_PATH)], check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'exécution de clean_data.py : {e}")

    if not CLEAN_CSV_PATH.exists():
        raise HTTPException(status_code=500, detail="Le fichier nettoyé n'a pas été généré par clean_data.py")

    df_clean = pd.read_csv(CLEAN_CSV_PATH, encoding="utf-8")
    _write_to_duckdb_and_parquet(df_clean, con)

    return {
        "rows": len(df_clean),
        "message": f"✅ Fichier '{file.filename}' nettoyé et chargé ({len(df_clean)} lignes).",
        "clean_csv_path": str(CLEAN_CSV_PATH)
    }


# === ROUTE 3 : Subset (Filtrage) ===
@router.post("/subset", response_model=schemas.SubsetResponse)
def subset(filters: schemas.CohortFilter, limit: int = Query(10000, ge=1, le=50000), con=Depends(get_con)):
    """Filtrage des données selon les conditions fournies."""
    tables = [r[0] for r in con.execute("SHOW TABLES").fetchall()]
    if "results" not in tables:
        raise HTTPException(status_code=400, detail="La table `results` n'existe pas. Exécutez d'abord /upload_local.")

    try:
        where_clause, params = build_where_clause(filters.conditions, filters.logic)
        df = con.execute(f"SELECT * FROM results WHERE {where_clause} LIMIT {int(limit)}", params).fetchdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur DuckDB : {e}")

    return {"rowcount": len(df), "records": df.to_dict(orient="records")}
