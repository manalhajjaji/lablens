# backend/schemas.py
from pydantic import BaseModel
from typing import Optional,List, Dict, Any
from datetime import date

class PanelResponse(BaseModel):
    numorden: str
    Date: date
    n_tests: int
    tests_list: str  # comma-separated

class RepeatResponse(BaseModel):
    numorden: str
    nombre: str
    repeat_count: int
    first_date: date
    last_date: date
    days_span: int

class StatsSummary(BaseModel):
    total_rows: int
    total_patients: int
    total_tests: int
    date_range: List[date]
    avg_age: Optional[float]
    missing_edad: int

class FilterCondition(BaseModel):
    column: str
    operator: str  # eq, ne, gt, lt, in, contains
    value: Any

class CohortFilter(BaseModel):
    conditions: List[FilterCondition]
    logic: str = "AND"  # AND / OR

class CohortRow(BaseModel):
    numorden: str
    sexo: str
    edad: Optional[int] = None
    nombre: str
    textores: str
    nombre2: str
    Date: str  # ← CHANGÉ ICI

    class Config:
        from_attributes = True

class CohortQueryResponse(BaseModel):
    data: List[CohortRow]
    total: int                     # nombre total de lignes (sans LIMIT)
    filtered: int