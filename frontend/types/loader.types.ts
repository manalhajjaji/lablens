// types/loader.types.ts

export interface UploadResponse {
  rows: number;
  message: string;
  clean_csv_path: string;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number;
}

export interface CohortFilter {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

export interface SubsetResponse {
  rowcount: number;
  records: BloodWorkRecord[];
}

export interface BloodWorkRecord {
  numorden: string;
  sexo: 'M' | 'F';
  edad: number;
  nombre: string;
  textores: string | number;
  nombre2: string;
  Date: string;
}
