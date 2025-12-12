// types/api.types.ts

export interface BloodWorkResult {
  numorden: string;
  sexo: 'M' | 'F';
  edad: number;
  nombre: string;
  textores: string | number;
  nombre2: string;
  Date: string;
}

export interface StatsSummary {
  total_rows: number;
  total_patients: number;
  total_tests: number;
  date_range: [string, string];
  avg_age: number;
  missing_edad: number;
}
