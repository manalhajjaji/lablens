from pathlib import Path
import duckdb
from typing import Generator

def get_con() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    """
    Crée une connexion DuckDB en mémoire pour exécuter les requêtes.
    Les données sont lues depuis les fichiers Parquet, donc pas besoin de fichier .duckdb persistant.
    """
    con = duckdb.connect(":memory:")
    try:
        yield con
    finally:
        con.close()

def init_db():
    """
    Fonction appelée au démarrage de l'application (via main.py).
    S'assure que les dossiers de données existent.
    """
    required_paths = [
        Path("data/raw"),
        Path("data/cleaned"),
        Path("data/processed")
    ]
    
    for p in required_paths:
        p.mkdir(parents=True, exist_ok=True)
        
    print("✅ Base de données (dossiers) initialisée.")