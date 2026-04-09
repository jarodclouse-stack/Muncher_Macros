export interface Food {
  id?: string;
  name: string;
  serving: string;
  sUnit?: string;
  sQty?: number;
  cal: number;
  p: number;
  c: number;
  f: number;
  fb?: number;
  sugars?: number;
  sat?: number;
  mono?: number;
  poly?: number;
  trans?: number;
  chol?: number;
  Sodium?: number;
  Potassium?: number;
  ingredients?: string;
  [key: string]: any; // For other micro-nutrients
}

export interface StagedFood extends Food {
  qty: number;
  unit: string;
  _src?: string;
}
