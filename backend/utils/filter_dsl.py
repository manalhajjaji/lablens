# backend/utils/filter_dsl.py
from typing import List
from backend.schemas import FilterCondition

def build_where_clause(conditions: List[FilterCondition], logic: str = "AND") -> str:
    if not conditions:
        return "1=1"

    clauses = []
    for cond in conditions:
        col = cond.column
        op = cond.operator
        val = cond.value

        if op == "eq":
            clause = f"{col} = ?" if val is not None else f"{col} IS NULL"
        elif op == "ne":
            clause = f"{col} <> ?" if val is not None else f"{col} IS NOT NULL"
        elif op == "gt":
            clause = f"{col} > ?"
        elif op == "lt":
            clause = f"{col} < ?"
        elif op == "in":
            placeholders = ",".join(["?"] * len(val))
            clause = f"{col} IN ({placeholders})"
        elif op == "contains":
            clause = f"LOWER({col}) LIKE LOWER(?)"
            val = f"%{val}%"
        else:
            raise ValueError(f"Unsupported operator: {op}")

        if op not in ["eq", "ne"] or val is not None:
            clauses.append((clause, val))

    where_sql = f" {logic} ".join([c[0] for c in clauses])
    params = [c[1] for c in clauses if len(c) > 1]
    return where_sql, params