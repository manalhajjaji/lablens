# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import stats, panels, repeats, coordering,export ,cohorts , views , cohort_stats  , raw_sql , auth
from backend.models import init_db

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stats.router)
app.include_router(panels.router)
app.include_router(repeats.router)
app.include_router(coordering.router)
app.include_router(export.router)
app.include_router(cohorts.router)
app.include_router(views.router)
app.include_router(cohort_stats.router)
app.include_router(raw_sql.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "LabLens API is running!", "docs": "/docs"}