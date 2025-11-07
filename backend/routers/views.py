from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlmodel import Session, select
from backend.models import CohortView, get_session
from backend.schemas import CohortFilter
import json
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.models import get_current_user, UserRole
from backend.models import AuditLog, User
from backend.utils.filter_dsl import build_where_clause
from backend.schemas import CohortQueryResponse, CohortRow
from backend.database import get_con
import duckdb

router = APIRouter(prefix="/views", tags=["cohort-views"])

security = HTTPBearer()

# ========================================
# CREATE VIEW (protégé 🔒)
# ========================================
@router.post("/", response_model=CohortView)
def create_view(
    view: CohortView, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Crée une nouvelle vue de cohorte.
    
    **Requires:** USER role
    """
    view.created_by = current_user.username
    try:
        CohortFilter.parse_raw(view.filter_json)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid filter JSON: {e}")
    
    session.add(view)
    session.commit()
    session.refresh(view)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.username,
        action="create_view",
        resource_id=view.id,
        details=f"View '{view.name}' created"
    )
    session.add(audit)
    session.commit()
    
    return view

# ========================================
# PUBLIC VIEW (non protégé, sans 🔒)
# ========================================
@router.get("/public/{view_id}", response_model=CohortQueryResponse)
def public_view(
    view_id: str,
    limit: int = 100,
    offset: int = 0,
    con: duckdb.DuckDBPyConnection = Depends(get_con),
    session: Session = Depends(get_session)
):
    """
    Accède à une vue publique partagée.
    
    **Requires:** AUCUNE AUTHENTIFICATION (endpoint public)
    
    Retourne les données filtrées si la vue est marquée comme publique.
    """
    view = session.get(CohortView, view_id)
    if not view or not view.is_public:
        raise HTTPException(
            status_code=404, 
            detail="Public view not found or not public"
        )

    # Parse filter
    filt = CohortFilter.parse_raw(view.filter_json)
    where_sql, params = build_where_clause(filt.conditions, filt.logic)

    # Count filtered
    count_q = f"SELECT COUNT(*) FROM results WHERE {where_sql}"
    filtered = con.execute(count_q, params).fetchone()[0]

    # Query data
    query = f"SELECT * FROM results WHERE {where_sql} LIMIT ? OFFSET ?"
    df = con.execute(query, params + [limit, offset]).fetchdf()

    # Total
    total = con.execute("SELECT COUNT(*) FROM results").fetchone()[0]

    data_list = []
    for row in df.to_dict(orient="records"):
        row["Date"] = str(row["Date"])
        data_list.append(CohortRow(**row))

    return CohortQueryResponse(data=data_list, total=total, filtered=filtered)

# ========================================
# LIST ALL VIEWS (protégé 🔒)
# ========================================
@router.get("/", response_model=List[CohortView])
def list_views(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Liste toutes les vues accessibles.
    
    **Requires:** USER role
    
    - ADMIN voit toutes les vues
    - USER voit uniquement ses propres vues
    """
    if current_user.role == UserRole.ADMIN:
        return session.exec(select(CohortView)).all()
    
    # User voit uniquement ses vues
    return session.exec(
        select(CohortView).where(CohortView.created_by == current_user.username)
    ).all()

# ========================================
# GET ONE VIEW (protégé 🔒)
# ========================================
@router.get("/{view_id}", response_model=CohortView)
def get_view(
    view_id: str,
    current_user: User = Depends(get_current_user),  # ← AJOUTER ICI
    session: Session = Depends(get_session)
):
    """
    Récupère les détails d'une vue spécifique.
    
    **Requires:** USER role (propriétaire) ou ADMIN
    """
    view = session.get(CohortView, view_id)
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    
    # Vérifier les permissions
    if current_user.role != UserRole.ADMIN and view.created_by != current_user.username:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this cohort"
        )
    
    return view

# ========================================
# DELETE VIEW (protégé 🔒)
# ========================================
@router.delete("/{view_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_view(
    view_id: str, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Supprime une vue de cohorte.
    
    **Requires:** OWNER ou ADMIN
    """
    view = session.get(CohortView, view_id)
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    
    if view.created_by != current_user.username and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(view)
    session.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.username,
        action="delete_view",
        resource_id=view_id,
        details=f"View '{view.name}' deleted"
    )
    session.add(audit)
    session.commit()

    return None