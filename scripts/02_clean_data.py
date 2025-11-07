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

# NOUVEAU : Suppression des lignes où sexo != 'F' et != 'M'
print(f"Sexo values before cleaning: {df['sexo'].unique()}")
print(f"Nombre de lignes AVANT suppression sexo invalide: {len(df)}")
df = df[df['sexo'].isin(['F', 'M'])]
print(f"Sexo values after cleaning: {df['sexo'].unique()}")
print(f"Nombre de lignes APRÈS suppression sexo invalide: {len(df)}")

#Save cleaned data
df.to_csv(output_path, index=False, encoding="utf-8")
print(f"Cleaned dataset saved to: {output_path}")
print(f"Final shape: {df.shape}")
