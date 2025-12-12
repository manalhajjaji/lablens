from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import duckdb
import pandas as pd
from pathlib import Path
import io

router = APIRouter(prefix="/export", tags=["export"])

# Chemins vers les fichiers générés
DATA_DIR = Path("data/processed")
PANELS_PATH = DATA_DIR / "panels.parquet"
REPEATS_PATH = DATA_DIR / "repeats.parquet"
RESULTS_PATH = DATA_DIR / "results.parquet"

def stream_csv(path: Path, filename: str):
    """Fonction utilitaire pour streamer un CSV à partir d'un Parquet"""
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Fichier de données non trouvé : {filename}")

    try:
        # On lit le parquet avec DuckDB puis convertit en Pandas pour l'export CSV facile
        # Note : Pour des fichiers géants (>1Go), on ferait du streaming pur, 
        # mais ici Pandas est suffisant et rapide.
        con = duckdb.connect(":memory:")
        df = con.execute(f"SELECT * FROM read_parquet('{path.as_posix()}')").fetchdf()
        
        # Buffer en mémoire pour le CSV
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        return response
        
    except Exception as e:
        print(f"Erreur export CSV : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du CSV : {str(e)}")

@router.get("/panels/csv")
def export_panels_csv():
    return stream_csv(PANELS_PATH, "panels_export.csv")

@router.get("/repeats/csv")
def export_repeats_csv():
    return stream_csv(REPEATS_PATH, "repeats_export.csv")

@router.get("/results/csv")
def export_results_csv():
    return stream_csv(RESULTS_PATH, "full_results_export.csv")