# backend/utils/filter_dsl.py

operator_map = {
    "eq": "=",
    "ne": "!=",
    "gt": ">",
    "lt": "<",
    "gte": ">=",
    "lte": "<=",
    "contains": "LIKE"
}

NUMERIC_COLS = {"edad", "textores"}  # colonnes numériques

def build_where_clause(conditions, logic):
    where_parts = []
    params = []

    for cond in conditions:
        op = operator_map.get(cond.operator)
        if not op:
            raise ValueError(f"Unsupported operator: {cond.operator}")

        # detection colonne numérique
        if cond.column in NUMERIC_COLS:
            where_parts.append(f"{cond.column} {op} ?")
            params.append(float(cond.value))  # cast numeric
        else:
            if op == "LIKE":
                where_parts.append(f"{cond.column} {op} ?")
                params.append(f"%{cond.value}%")
            else:
                where_parts.append(f"{cond.column} {op} ?")
                params.append(cond.value)

    clause = f" {logic} ".join(where_parts)
    return clause, params
