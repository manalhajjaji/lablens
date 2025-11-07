"""
This script is designed to **clean the bloodwork dataset** based on the results 
from `inspect_data.py`. It ensures the dataset is ready for analysis or use in 
the web app by fixing data types, handling missing values, and enforcing a consistent schema.

Why this approach:
- Dropping rows with missing or zero age ensures the dataset is consistent for age-based analysis.
- Filling missing 'nombre2' with "Unknown" prevents loss of rows where other data is valid.
- Keeping 'textores' flexible maintains compatibility with both numeric and qualitative lab results.


"""


import pandas as pd


input_path = "data/raw/original_synthetic_bloodwork.csv"
output_path = "data/cleaned/cleaned_bloodwork.csv"


#Load dataset
df = pd.read_csv(input_path, encoding="latin1")

print(" File loaded successfully.")
print(f"Initial shape: {df.shape}")

# Keep only expected columns 
expected_cols = ["numorden", "sexo", "edad", "nombre", "textores", "nombre2", "Date"]
df = df[expected_cols]

#Parse Date (day-first)
df["Date"] = pd.to_datetime(df["Date"], format="%d/%m/%Y", errors="coerce")

#Convert edad to integer and replace invalid with NaN
df["edad"] = pd.to_numeric(df["edad"], errors="coerce")
df["edad"] = df["edad"].astype("Int64")
df.loc[df["edad"] == 0, "edad"] = pd.NA  # Mark 0 ages as missing

# Handle missing values
# Drop rows where edad is missing
df = df.dropna(subset=["edad"])

# Fill missing nombre2 with "Unknown"
df["nombre2"] = df["nombre2"].fillna("Unknown")

#Ensure textores is flexible (string)
df["textores"] = df["textores"].astype(str)
 
#  Format numeric textores values with 2 decimal places
def format_textores(val):
    try:
        num = float(val)
        return f"{num:.2f}"
    except ValueError:
        return val  # if not numeric, keep original string

df["textores"] = df["textores"].apply(format_textores)
#Save cleaned data
df.to_csv(output_path, index=False, encoding="utf-8")
print(f"Cleaned dataset saved to: {output_path}")
print(f"Final shape: {df.shape}")
