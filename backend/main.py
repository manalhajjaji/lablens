from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import loader, stats, panels, repeats, coordering, export
from backend.database import init_db
from backend.routers import llm


app = FastAPI(title="LabLens API")

origins = [
    "http://localhost:3000",  # Ton frontend React
    "http://127.0.0.1:3000",
    "*"                       # En dev, on peut tout autoriser pour être sûr
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # Autorise ces origines
    allow_credentials=True,
    allow_methods=["*"],      # Autorise toutes les méthodes (GET, POST...)
    allow_headers=["*"],      # Autorise tous les headers
)

# Initialisation de la DB au démarrage
@app.on_event("startup")
def on_startup():
    init_db()

# Inclusion des routers
app.include_router(loader.router)
app.include_router(stats.router)
app.include_router(panels.router)
app.include_router(repeats.router)
app.include_router(coordering.router)
app.include_router(export.router)
app.include_router(llm.router)

@app.get("/")
def read_root():
    return {"message": "LabLens Backend is running 🚀"}