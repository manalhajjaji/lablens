# LabLens — Interactive Blood-Work Explorer

**Free Subsetting • Cohort Views • Statistics • Panels & Repeats • LLM Assistant**

LabLens est une application web interactive permettant d'explorer et d'analyser des données de résultats de biologie médicale (prises de sang).  
Elle offre un subsetting libre, des vues de cohortes sauvegardables, des statistiques descriptives, des visualisations avancées (panels same-day, répétitions, co-prescriptions) et un **assistant LLM** qui traduit les questions en langage naturel en requêtes précises sur les données.

## Fonctionnalités principales

- **Chargement & validation** d'un fichier CSV avec schéma strict
- **Filtrage multi-critères** intuitif (numorden, sexo, edad, nombre, nombre2, Date, etc.)
- **Vues de cohortes** sauvegardables et partageables
- **Statistiques descriptives** (répartitions, valeurs manquantes, résumés numériques/qualitatifs)
- **Visualisations interactives** :
  - Distributions et tendances temporelles
  - Panels de tests (même patient, même jour)
  - Analyses de répétitions (tests répétés sur plusieurs dates)
  - Paires de tests co-prescrits (co-ordering) avec heatmaps
- **Export** CSV 
- **Assistant LLM** : posez des questions en langage naturel ("Montre-moi les patients de plus de 60 ans avec glucose élevé", "Compare la créatinine hommes/femmes", etc.) → l'IA génère automatiquement les filtres, exécute la requête et explique son raisonnement

## Schéma des données

Chaque ligne = un résultat biologique

| Colonne    | Description                          | Type                  |
|------------|--------------------------------------|-----------------------|
| numorden   | Identifiant patient                  | string / int          |
| sexo       | Sexe                                 | M / F                 |
| edad       | Âge                                  | int                   |
| nombre     | Nom du paramètre biologique          | string                |
| textores   | Résultat (numérique ou qualitatif)   | mixed (float ou string comme "TRACE") |
| nombre2    | Service / catégorie                  | string                |
| Date       | Date du prélèvement                  | string (format dd/mm/yyyy) |

## Architecture technique

- **Backend** : FastAPI + DuckDB (en dev)  
- **Base de données** : DuckDB (fichier `data/lablens.duckdb`) pour requêtes rapides et légères
- **Frontend** : Next.js (React) + Tailwind CSS + ECharts/Plotly pour les graphiques
- **LLM** : Groq (Llama 3) via client OpenAI-compatible, avec templates guidés et validation sécurisée
- **Conteneurisation** : Docker + Docker Compose

## Installation & lancement en local

### Prérequis

- Python 3.10+
- Node.js 18+ (pour le frontend)
- Git

### Étapes

#### 1. Clonez le repository
```bash
git clone <votre-repo>
cd Lablens
```

#### 2. Lancez le backend (FastAPI + DuckDB)

Ouvrez un terminal à la racine du projet :
```bash
# Créer et activer un venv (optionnel mais recommandé)
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sur Windows

# Installer les dépendances Python
pip install -r requirements.txt
# ou au minimum :
pip install fastapi uvicorn duckdb pandas python-dotenv openai

# Lancer le serveur API
uvicorn backend.main:app --reload --port 8000
```

#### 3. Lancez le frontend (Next.js)

Ouvrez un **second terminal** et allez dans le dossier frontend :
```bash
cd frontend
npm install
npm run dev
```

#### 4. Ouvrez l'application

→ http://localhost:3000

L'API est disponible sur http://localhost:8000 (et la doc Swagger sur http://localhost:8000/docs)

### Configuration LLM (optionnel mais recommandé)

Pour activer l'assistant en langage naturel :

1. Obtenez une clé API gratuite sur https://console.groq.com/keys
2. Créez un fichier `.env` à la racine du projet :
```
   GROQ_API_KEY=gsk_votre_clé_ici
```

Le projet charge automatiquement cette variable grâce à `python-dotenv`.

## Utilisation de l'assistant LLM

Cliquez sur le petit cercle à droite, en bas de l'interface :

- Tapez votre question
- Exemples :
  - "Patients avec hémoglobine basse et ferritine normale"
  - "Évolution du cholesterol chez les femmes de plus de 50 ans"
  - "Quels sont les tests les plus souvent répétés ?"

L'IA traduit, applique les filtres, affiche les résultats et explique sa démarche.

## Docker (option tout-en-un)
```bash
docker compose up --build
```

→ Application accessible sur http://localhost:3000

## Sécurité & confidentialité

- Mode développement : données synthétiques uniquement
- Requêtes LLM en read-only avec validation et audit
- Aucune donnée sensible n'est envoyée en dehors du sandbox


---

**LabLens** — Transformez vos données de biologie en insights interactifs, rapidement et en toute sécurité.