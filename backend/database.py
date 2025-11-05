# backend/database.py
from pathlib import Path
import duckdb
from typing import Generator

DB_PATH = Path("data/lablens.duckdb")

def get_con() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"DuckDB database not found: {DB_PATH}")
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        yield con
    finally:
        con.close()