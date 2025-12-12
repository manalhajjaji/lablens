from pydantic import BaseModel
from typing import List, Optional, Any, Union

# === SCHEMAS LOADER (Upload & Filtres) ===

class UploadResponse(BaseModel):
    rows: int
    message: str
    filename: str
    clean_csv_path: str

class FilterCondition(BaseModel):
    column: str
    operator: str  # eq, ne, gt, lt, in, contains
    value: Any

class CohortFilter(BaseModel):
    conditions: List[FilterCondition]
    logic: str = "AND"

class SubsetResponse(BaseModel):
    rowcount: int
    records: List[dict]

# === SCHEMAS STATS (Globales & Test Spécifique) ===

class StatsSummary(BaseModel):
    total_rows: int
    total_patients: int
    total_tests: int
    # CORRECTION : On accepte des strings car tu formates en "dd/mm/yyyy"
    date_range: List[Optional[str]] 
    avg_age: Optional[float] = None
    missing_edad: int 
    total_services: Optional[int] = 0

# Nouveaux schémas pour l'analyse d'un test (Search bar)
class TestNumericSummary(BaseModel):
    mean: float
    std: float
    p25: float
    p50: float
    p75: float

class TestValueDistribution(BaseModel):
    textores: str
    count: int

class TestStatsResponse(BaseModel):
    test: str
    numeric_summary: Optional[TestNumericSummary] = None
    values: List[TestValueDistribution]
    error: Optional[str] = None

# === SCHEMAS PANELS ===

class PanelResponse(BaseModel):
    # CORRECTION : DuckDB renvoie parfois int, parfois str pour les IDs
    numorden: Union[str, int]
    Date: Optional[str]
    n_tests: int
    # CORRECTION : DuckDB renvoie une liste Python, pas une string séparée par des virgules
    tests_list: Union[List[str], Any]

# === SCHEMAS REPEATS ===

class RepeatResponse(BaseModel):
    numorden: Union[str, int]
    nombre: Optional[str]
    repeat_count: int
    first_date: Optional[str]
    last_date: Optional[str]
    days_span: Optional[int]
    
# === SCHEMAS LLM ASSISTANT ===

class LLMQueryRequest(BaseModel):
    prompt: str

class LLMQueryResponse(BaseModel):
    result: Any
    query_executed: Optional[str]
    explanation: str