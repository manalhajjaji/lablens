# backend/schemas.py
from pydantic import BaseModel
from typing import List, Optional, Any
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