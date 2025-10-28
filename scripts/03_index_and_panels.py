"""
03_index_and_panels.py

Objectif (selon le PDF LabLens - Page 1 & 2) :
    1. Charger les données nettoyées (de 02_clean_data.py)
    2. Créer une base DuckDB avec :
       - Table `results` (données brutes)
       - Index sur : numorden, nombre, nombre2, Date
    3. Pré-calculer :
       - Table `panels`  → tests par patient/jour
       - Table `repeats` → tests répétés sur plusieurs jours
    4. Sauvegarder en Parquet optimisé + index dans DuckDB

Conforme au pipeline :
    → "Indexing — indices on numorden, nombre, nombre2, Date; precompute panel aggregates."
    → "Panels & Repeats — number of tests per patient-day; unique tests per day; repeated test counts per patient across distinct dates."

Sortie :
    - data/processed/results.parquet
    - data/processed/panels.parquet
    - data/processed/repeats.parquet
    - data/lablens.duckdb (avec tables + index)
"""

import pandas as pd
import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path
import logging

# ================================
# Configuration & Chemins
# ================================
RAW_CLEANED_PATH = "data/cleaned/cleaned_bloodwork.csv"
PARQUET_RESULTS_PATH = "data/processed/results.parquet"
PARQUET_PANELS_PATH = "data/processed/panels.parquet"
PARQUET_REPEATS_PATH = "data/processed/repeats.parquet"
DUCKDB_PATH = "data/lablens.duckdb"

Path("data/processed").mkdir(parents=True, exist_ok=True)

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger(__name__)

# ================================
# 1. Chargement des données nettoyées
# ================================
log.info("Étape 1 : Chargement du fichier nettoyé...")
if not Path(RAW_CLEANED_PATH).exists():
    raise FileNotFoundError(f"Fichier non trouvé : {RAW_CLEANED_PATH}")

df = pd.read_csv(
    RAW_CLEANED_PATH,
    parse_dates=["Date"],
    dtype={
        "numorden": "string",
        "sexo": "category",
        "edad": "Int64",
        "nombre": "string",
        "textores": "string",
        "nombre2": "string"
    }
)

log.info(f"Données chargées : {df.shape[0]:,} lignes, {df.shape[1]} colonnes")
log.info(f"Plage de dates : {df['Date'].min().date()} → {df['Date'].max().date()}")
log.info(f"Patients uniques : {df['numorden'].nunique():,}")
log.info(f"Tests uniques : {df['nombre'].nunique():,}")

# ================================
# 2. Sauvegarde en Parquet optimisé
# ================================
log.info("Étape 2 : Sauvegarde en Parquet optimisé...")
table = pa.Table.from_pandas(df, preserve_index=False)
pq.write_table(
    table,
    PARQUET_RESULTS_PATH,
    compression="snappy",
    use_dictionary=True,
    write_statistics=True
)
log.info(f"Parquet sauvegardé : {PARQUET_RESULTS_PATH}")

# ================================
# 3. Connexion DuckDB + Table `results` + Index
# ================================
log.info("Étape 3 : Création de la base DuckDB et table `results` avec index...")
con = duckdb.connect(DUCKDB_PATH)

# Créer table results
con.execute(f"""
CREATE OR REPLACE TABLE results AS
SELECT * FROM read_parquet('{PARQUET_RESULTS_PATH}')
""")

# Index
index_queries = [
    "CREATE INDEX idx_numorden ON results (numorden)",
    "CREATE INDEX idx_nombre ON results (nombre)",
    "CREATE INDEX idx_nombre2 ON results (nombre2)",
    "CREATE INDEX idx_date ON results (Date)",
    "CREATE INDEX idx_patient_date ON results (numorden, Date)"
]

for query in index_queries:
    con.execute(query)
    log.info(f"Index créé : {query.split(' ON ')[1]}")

# ================================
# 4. Pré-calcul des PANELS
# ================================
log.info("Étape 4 : Pré-calcul des panels (tests par patient/jour)...")

panels_query = """
SELECT
    numorden,
    Date,
    COUNT(*) AS n_tests,
    LIST(DISTINCT nombre) AS tests_list
FROM results
GROUP BY numorden, Date
ORDER BY numorden, Date
"""

panels_df = con.execute(panels_query).fetchdf()

# Convertir les listes DuckDB en chaînes
panels_df["tests_list"] = panels_df["tests_list"].apply(
    lambda x: ",".join(sorted([str(item) for item in x])) if x is not None and len(x) > 0 else ""
)

log.info(f"Panels calculés : {panels_df.shape[0]:,} panels uniques")
log.info(f"Panel moyen : {panels_df['n_tests'].mean():.2f} tests/jour")
log.info(f"Max tests/jour : {panels_df['n_tests'].max()}")

# Sauvegarde Parquet
panels_table = pa.Table.from_pandas(panels_df, preserve_index=False)
pq.write_table(panels_table, PARQUET_PANELS_PATH, compression="snappy")
log.info(f"Panels sauvegardés : {PARQUET_PANELS_PATH}")

# Créer table `panels` dans DuckDB
con.execute(f"""
CREATE OR REPLACE TABLE panels AS
SELECT * FROM read_parquet('{PARQUET_PANELS_PATH}')
""")
con.execute("CREATE INDEX idx_panels_patient_date ON panels (numorden, Date)")
log.info("Table `panels` créée avec index")

# ================================
# 5. Pré-calcul des REPEATS (tests répétés sur plusieurs jours)
# ================================
log.info("Étape 5 : Pré-calcul des repeats (tests répétés sur plusieurs jours)...")

repeats_query = """
SELECT
    numorden,
    nombre,
    COUNT(DISTINCT Date) AS repeat_count,
    MIN(Date) AS first_date,
    MAX(Date) AS last_date,
    DATEDIFF('day', MIN(Date), MAX(Date)) + 1 AS days_span
FROM results
GROUP BY numorden, nombre
HAVING COUNT(DISTINCT Date) > 1
ORDER BY repeat_count DESC, days_span DESC
"""

repeats_df = con.execute(repeats_query).fetchdf()

log.info(f"Repeats calculés : {repeats_df.shape[0]:,} cas de tests répétés")
if len(repeats_df) > 0:
    top_test = repeats_df.iloc[0]
    log.info(f"Test le plus répété : {top_test['nombre']} ({top_test['repeat_count']} fois sur {top_test['days_span']} jours)")

# Sauvegarde Parquet
repeats_table = pa.Table.from_pandas(repeats_df, preserve_index=False)
pq.write_table(repeats_table, PARQUET_REPEATS_PATH, compression="snappy")
log.info(f"Repeats sauvegardés : {PARQUET_REPEATS_PATH}")

# Créer table `repeats` dans DuckDB
con.execute(f"""
CREATE OR REPLACE TABLE repeats AS
SELECT * FROM read_parquet('{PARQUET_REPEATS_PATH}')
""")
con.execute("CREATE INDEX idx_repeats_patient_test ON repeats (numorden, nombre)")
con.execute("CREATE INDEX idx_repeats_count ON repeats (repeat_count DESC)")
log.info("Table `repeats` créée avec index")

# ================================
# 6. Statistiques rapides (bonus)
# ================================
stats = con.execute("""
SELECT
    AVG(n_tests) AS avg_tests_per_day,
    MAX(n_tests) AS max_tests_per_day,
    COUNT(*) AS total_panels,
    COUNT(DISTINCT numorden) AS patients_with_panels
FROM panels
""").fetchone()

log.info(f"Statistiques panels : "
         f"moyenne={stats[0]:.2f}, max={stats[1]}, panels={stats[2]:,}, patients={stats[3]:,}")

# ================================
# 7. Vérification finale
# ================================
log.info("Étape 7 : Vérification finale...")
tables = con.execute("SHOW TABLES").fetchdf()["name"].tolist()
log.info(f"Tables dans DuckDB : {tables}")

# Test jointure panels
sample_panel = con.execute("""
SELECT r.numorden, r.Date, p.n_tests, p.tests_list
FROM results r
JOIN panels p ON r.numorden = p.numorden AND r.Date = p.Date
LIMIT 3
""").fetchdf()
log.info("Jointure results ↔ panels : OK")

# Test repeats
sample_repeat = con.execute("SELECT * FROM repeats LIMIT 3").fetchdf()
log.info(f"Repeats : OK ({len(sample_repeat)} échantillons)")

# ================================
# 8. Nettoyage & Fermeture
# ================================
con.close()
log.info("Base DuckDB fermée.")
log.info("="*70)
log.info("PRÉ-CALCUL TERMINÉ AVEC SUCCÈS (Weeks 1–2 du PDF)")
log.info("Fichiers générés :")
log.info(f"  → {PARQUET_RESULTS_PATH}")
log.info(f"  → {PARQUET_PANELS_PATH}")
log.info(f"  → {PARQUET_REPEATS_PATH}")
log.info(f"  → {DUCKDB_PATH} (avec results, panels, repeats + index)")
log.info("="*70)

# ================================
# Fonction utilitaire (API-ready)
# ================================
def get_patient_panel(patient_id: str, date: str) -> dict:
    """Récupère un panel complet (pour backend FastAPI)"""
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    result = con.execute("""
        SELECT r.*, p.n_tests, p.tests_list
        FROM results r
        JOIN panels p ON r.numorden = p.numorden AND r.Date = p.Date
        WHERE r.numorden = ? AND r.Date = ?
    """, [patient_id, date]).fetchdf()
    con.close()
    return result.to_dict(orient="records")

def get_patient_repeats(patient_id: str) -> dict:
    """Récupère les tests répétés d’un patient"""
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    result = con.execute("""
        SELECT nombre, repeat_count, first_date, last_date, days_span
        FROM repeats
        WHERE numorden = ?
        ORDER BY repeat_count DESC
    """, [patient_id]).fetchdf()
    con.close()
    return result.to_dict(orient="records")

# Exemple d’usage
# if __name__ == "__main__":
#     print(get_patient_panel("P0001", "2024-03-15"))
#     print(get_patient_repeats("P0001"))