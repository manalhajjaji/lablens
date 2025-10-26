
"""
This script is designed to **inspect and analyze a bloodwork dataset** before cleaning. 

Its main goal is to identify potential data quality issues, understand the structure of 
the dataset, and generate insights that will guide the cleaning process in a separate 
script (`02_clean_data.py`). 


"""

import pandas as pd

#Loading the dataset 
df = pd.read_csv("data/raw/original_synthetic_bloodwork.csv", encoding="latin1")

print("File loaded successfully.")
print(f"Shape: {df.shape}")
print("Columns:", list(df.columns))

#Expected schema check
expected_cols = ["numorden", "sexo", "edad", "nombre", "textores", "nombre2", "Date"]
missing_cols = [c for c in expected_cols if c not in df.columns]
extra_cols = [c for c in df.columns if c not in expected_cols]

if missing_cols:
    print(f" Missing columns: {missing_cols}")
else:
    print(" All expected columns are present.")
if extra_cols:
    print(f" Extra columns found: {extra_cols}")

#Data type inspection 
print("\n--- Data Types ---")
print(df.dtypes)

#Missing values summary 
print("\n--- Missing Values per Column ---")
print(df.isna().sum())

#Date parsing check 
try:
    parsed_dates = pd.to_datetime(df["Date"], format="%d/%m/%Y", errors="coerce")
    invalid_dates = parsed_dates.isna().sum()
    print(f"\nInvalid date entries: {invalid_dates}")
except Exception as e:
    print(f" Date parsing failed: {e}")

#Edad (age) analysis 
df["edad"] = pd.to_numeric(df["edad"], errors="coerce")
zero_age_df = df[df["edad"] == 0]
total_zero = len(zero_age_df)
percent_zero = total_zero / len(df) * 100

print(f"\nRows with edad = 0: {total_zero} ({percent_zero:.2f}% of dataset)")
print(f"Unique numorden with edad=0: {zero_age_df['numorden'].nunique()}")

print("\nMost common tests for edad = 0:")
print(zero_age_df["nombre"].value_counts().head(10))



print("\nInspection complete")
