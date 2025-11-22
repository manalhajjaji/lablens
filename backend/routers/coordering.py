from fastapi import APIRouter, Depends, HTTPException
import duckdb
from backend.database import get_con
from pathlib import Path

router = APIRouter(prefix="/coordering", tags=["coordering"])

# Chemin vers le fichier généré par le loader
PARQUET_PATH = Path("data/processed/results.parquet")

def ensure_parquet_exists():
    if not PARQUET_PATH.exists():
        raise HTTPException(status_code=400, detail="Aucune donnée analysée. Veuillez uploader un fichier d'abord.")
    return f"'{PARQUET_PATH.as_posix()}'"

@router.get("/top-pairs")
def get_top_coordered(limit: int = 50, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    source = ensure_parquet_exists()
    
    try:
        # On requête directement le fichier Parquet
        query = f"""
            SELECT
                r1.nombre AS test1,
                r2.nombre AS test2,
                COUNT(*) AS co_occurrences
            FROM read_parquet({source}) r1
            JOIN read_parquet({source}) r2 
                ON r1.numorden = r2.numorden 
                AND r1.Date = r2.Date
            WHERE r1.nombre < r2.nombre
            GROUP BY test1, test2
            ORDER BY co_occurrences DESC
            LIMIT {limit}
        """
        df = con.execute(query).fetchdf()
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Error in top-pairs: {e}")
        return []

@router.get("/matrix-by-service")
def get_matrix_by_service(limit: int = 15, con: duckdb.DuckDBPyConnection = Depends(get_con)):
    source = ensure_parquet_exists()

    try:
        # Étape 1 : Récupérer les services les plus fréquents
        top_services_df = con.execute(f"""
            SELECT nombre2 AS service
            FROM read_parquet({source})
            WHERE nombre2 IS NOT NULL 
              AND TRIM(nombre2) != ''
              AND LOWER(nombre2) NOT LIKE '%unknown%'
            GROUP BY nombre2
            ORDER BY COUNT(*) DESC
            LIMIT {limit}
        """).fetchdf()

        top_services = top_services_df['service'].tolist()

        if not top_services:
            return []

        # Étape 2 : Matrice de co-occurrence
        # On échappe les apostrophes pour éviter les erreurs SQL
        services_str = "', '".join([s.replace("'", "''") for s in top_services])
        
        # J'ai SUPPRIMÉ le commentaire "// évite doublons" qui faisait planter ton code
        query = f"""
            SELECT 
                r1.nombre2 AS service1,
                r2.nombre2 AS service2,
                COUNT(*) AS freq
            FROM read_parquet({source}) r1
            JOIN read_parquet({source}) r2 
                ON r1.numorden = r2.numorden 
                AND r1.Date = r2.Date
            WHERE r1.nombre2 IN ('{services_str}')
              AND r2.nombre2 IN ('{services_str}')
              AND r1.nombre2 < r2.nombre2
            GROUP BY service1, service2
            ORDER BY freq DESC
        """
        
        df = con.execute(query).fetchdf()
        return df.to_dict(orient="records")
        
    except Exception as e:
        print(f"❌ Erreur matrix-by-service : {e}")
        raise HTTPException(status_code=500, detail=str(e))