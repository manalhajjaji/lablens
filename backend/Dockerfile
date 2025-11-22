# backend/Dockerfile

# Image Python légère
FROM python:3.10-slim

# Dossier de travail
WORKDIR /app

# Installation des outils système de base (nécessaire pour certaines libs de Data Science)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des dépendances Python
# On le fait AVANT de copier le code pour utiliser le cache Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du dossier backend et des scripts
COPY backend ./backend
COPY scripts ./scripts

# Création de la structure de dossiers pour les données
RUN mkdir -p data/raw data/cleaned data/processed

# Exposition du port FastAPI
EXPOSE 8000

# Lancement de l'application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]