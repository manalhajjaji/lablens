import pandas as pd
from typing import Any, Dict
import os
from openai import OpenAI 

# Initialize OpenAI client with Groq endpoint
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

def get_dataframe_context(df: pd.DataFrame) -> str:
    """
    Extracts metadata to help the LLM understand the data content.
    """
    try:
        services = list(df['nombre2'].dropna().unique())[:50] # Top 50 services
        tests = list(df['nombre'].dropna().unique())[:50]     # Top 50 tests
        
        return f"""
    Context Info:
    - Unique Services (nombre2) examples: {services}
    - Unique Tests (nombre) examples: {tests}
    """
    except:
        return ""

def get_llm_code(prompt: str, context: str = "") -> str:
    """
    Asks the LLM to convert a natural language query into a pandas command.
    """
    system_prompt = f"""
    You are an expert Data Scientist. You have access to a pandas DataFrame named `df`.
    
    The DataFrame `df` has the following columns:
    - `numorden` (ID request)
    - `sexo` (Gender: 'M', 'F')
    - `edad` (Age, numeric)
    - `nombre` (Test name, e.g., 'GLUCOSA')
    - `nombre2` (Service/Department)
    - `textores` (Result value, mixed type: numeric or text)
    - `Date` (Date string dd/mm/yyyy)

    {context}

    Your task: Convert the user's question into a SINGLE line of executable Python/Pandas code that returns the answer.
    
    Rules:
    1. RETURN ONLY THE CODE. No markdown, no backticks, no 'python', no explanations.
    2. The code must be an expression that evaluates to the result (e.g., `df['edad'].mean()`).
    3. DO NOT assign variables or use print(). Just the expression.
    4. **IMPORTANT**: When filtering text columns (nombre, nombre2), ALWAYS use `.str.contains('term', case=False, na=False)` instead of `==` to be robust.
    5. Handle `textores` carefully. If doing math (mean, max), convert to numeric: `pd.to_numeric(df['textores'], errors='coerce')`.
    6. If asking for a list of patients, return `df[...]`.
    7. If he sends a question that cannot be answered with the data, tell the user "Sorry, I can't answer that with the available data.".
    8. LANGUAGE MATCHING IS MANDATORY:
       - If the user asks in English, you MUST respond in English.
       - If the user asks in French, you MUST respond in French.
    9. Conversational examples:
       - User: "Hello" -> You: "Hello! How can I assist you?"
       - User: "Bonjour" -> You: "Bonjour ! Comment puis-je vous aider ?"
       - User: "What is your role?" -> You: "I am LabLens Explorer, here to help you analyze the blood dataset."
       - User: "Quel est ton rôle ?" -> You: "Je suis LabLens Explorer, ici pour vous aider à analyser le dataset."
    10. If the user says "Thank you", respond in the same language.
    """

    response = client.chat.completions.create(
        # 2. Changez le modèle (GPT-4 n'existe pas chez Groq, utilisez Llama3)
        model="llama-3.3-70b-versatile", 
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )
    
    code = response.choices[0].message.content.strip()
    
    # Cleanup if LLM returns markdown code blocks despite instructions
    if code.startswith("```"):
        code = code.replace("```python", "").replace("```", "").strip()
        
    return code

def get_llm_explanation(prompt: str, code: str, result: Any) -> str:
    """
    Asks the LLM to explain the result in natural language.
    """
    # Truncate result for prompt if it's too long to avoid token limits
    result_preview = str(result)
    if len(result_preview) > 1000:
        result_preview = result_preview[:1000] + "... (truncated)"

    explanation_prompt = f"""
    User Question: "{prompt}"
    Code Executed: `{code}`
    Result: {result_preview}
    
    Explain this result to the user in a clear, concise sentence. 
    Interpret the data.
    
    CRITICAL: You MUST answer in the SAME LANGUAGE as the "User Question".
    - If the question is in French, the explanation MUST be in French.
    - If the question is in English, the explanation MUST be in English.
    - Do NOT use English if the user asked in French.
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": explanation_prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

def safe_execute_pandas(code: str, df: pd.DataFrame) -> Any:
    """
    Executes the code in a restricted local scope containing only `df` and `pd`.
    """
    # Safety check: prevent import or dangerous builtins
    forbidden = ['import', 'exec', 'eval', 'open', 'os', 'sys', 'subprocess']
    if any(word in code for word in forbidden):
        raise ValueError("Unsafe code detected.")

    local_scope = {'df': df, 'pd': pd}
    
    try:
        # eval() is used for expressions. 
        # If the LLM generates complex statements, we might need exec(), 
        # but eval is safer for "single line return" logic.
        result = eval(code, {"__builtins__": {}}, local_scope)
        return result
    except Exception as e:
        raise ValueError(f"Execution error: {str(e)}")

def process_natural_language_query(prompt: str, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Orchestrates the LLM query process.
    """
    try:
        # 0. Build Context
        context = get_dataframe_context(df)

        # 1. Get Code
        code = get_llm_code(prompt, context)
        
        # --- HEURISTIC FOR CONVERSATIONAL RESPONSES ---
        # If the LLM returns a sentence instead of code (due to the new rules),
        # we shouldn't try to execute it.
        # We assume valid code must contain 'df' or 'pd'.
        if "df" not in code and "pd" not in code:
             return {
                "result": None,
                "query_executed": None,
                "explanation": code
            }
        # ----------------------------------------------

        # 2. Execute Code
        result = safe_execute_pandas(code, df)
        
        # Handle non-serializable results (like numpy types or DataFrames)
        if isinstance(result, pd.DataFrame):
            # Convert DataFrame to list of dicts (limit to 50 rows for performance)
            result = result.head(50).to_dict(orient='records')
        elif isinstance(result, pd.Series):
            # Convert Series to list
            result = result.head(50).tolist()
        elif hasattr(result, 'tolist'): 
            # Handle numpy arrays
            result = result.tolist()
        elif hasattr(result, 'item'): 
            # Handle numpy scalars
            try:
                result = result.item()
            except ValueError:
                pass # Keep as is if it fails
            
        # 3. Get Explanation
        explanation = get_llm_explanation(prompt, code, result)
        
        return {
            "result": result,
            "query_executed": code,
            "explanation": explanation
        }
        
    except Exception as e:
        return {
            "result": None,
            "query_executed": "Error",
            "explanation": f"I couldn't process that query. Error: {str(e)}"
        }