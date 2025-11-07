# backend/utils/filter_dsl.py
from typing import List, Tuple
from backend.schemas import FilterCondition

ALLOWED_COLUMNS = ["numorden", "sexo", "edad", "nombre", "textores", "nombre2", "Date"]

def build_where_clause(conditions: List[FilterCondition], logic: str = "AND") -> Tuple[str, List]:
    if not conditions:
        return "1=1", []

    clauses = []
    params = []

    for cond in conditions:
        if cond.column not in ALLOWED_COLUMNS:
            raise ValueError(f"Colonne non autorisée : {cond.column}")

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
        elif op == "ge":
            clause = f"{col} >= ?"
        elif op == "le":
            clause = f"{col} <= ?"
        elif op == "in":
            if not isinstance(val, list):
                raise ValueError("Opérateur 'in' nécessite une liste")
            placeholders = ",".join(["?"] * len(val))
            clause = f"{col} IN ({placeholders})"
            params.extend(val)
            clauses.append(clause)
            continue
        elif op == "contains":
            clause = f"LOWER({col}) LIKE LOWER(?)"
            val = f"%{val}%"
        else:
            raise ValueError(f"Opérateur non supporté : {op}")

        clauses.append(clause)
        if val is not None:
            params.append(val)

    if not clauses:
        return "1=1", []

    # CORRECTION ICI : enlever les parenthèses autour du JOIN
    where_sql = f" {logic} ".join(clauses)
    return where_sql, params