# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import stats, panels, repeats, coordering, export , loader

app = FastAPI(
    title="LabLens API",
    description="Interactive Blood-Work Explorer",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(loader.router)
app.include_router(stats.router)
app.include_router(panels.router)
app.include_router(repeats.router)
app.include_router(coordering.router)
app.include_router(export.router)

@app.get("/")
def root():
    return {"message": "LabLens API is running!", "docs": "/docs"}