from fastapi import APIRouter, HTTPException
from pathlib import Path
import pandas as pd

from backend.schemas import LLMQueryRequest, LLMQueryResponse
from backend.services.llm_service import process_natural_language_query

router = APIRouter(prefix="/llm", tags=["llm"])

# Path to your processed data (Parquet is faster/lighter than CSV)
RESULTS_PATH = Path("data/processed/results.parquet")
# Fallback if you are using the cleaned CSV
CLEANED_CSV_PATH = Path("data/cleaned/cleaned_bloodwork.csv")

def load_dataframe():
    if RESULTS_PATH.exists():
        return pd.read_parquet(RESULTS_PATH)
    elif CLEANED_CSV_PATH.exists():
        return pd.read_csv(CLEANED_CSV_PATH)
    else:
        raise FileNotFoundError("No data file found in data/processed/ or data/cleaned/")

@router.post("/query", response_model=LLMQueryResponse)
def query_llm(request: LLMQueryRequest):
    try:
        df = load_dataframe()
        
        # Call the service layer
        response_data = process_natural_language_query(request.prompt, df)
        
        return LLMQueryResponse(**response_data)
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))