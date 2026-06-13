export type FoodGroup = 
  | 'Vegetables'
  | 'Fruits'
  | 'Grains & Breads'
  | 'Meat & Poultry'
  | 'Fish & Seafood'
  | 'Dairy & Eggs'
  | 'Nuts & Seeds'
  | 'Fats & Oils'
  | 'Sweets & Snacks'
  | 'Beverages'
  | 'Mixed Meals'
  | 'Legumes & Beans'
  | 'Condiments & Sauces'
  | 'Supplements & Powders'
  | 'Herbs & Spices'
  | 'Soups & Stews'
  | 'Fast Food / Restaurant'
  | 'Alcoholic Beverages'
  | 'Other';

export interface RecipeItem {
  food: Food;
  qty: string;
  unit: string;
}

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
  fiber?: number;
  solubleFiber?: number;
  insolubleFiber?: number;
  sugars?: number;
  sat?: number;
  mono?: number;
  poly?: number;
  trans?: number;
  chol?: number;
  Sodium?: number;
  Potassium?: number;
  Calcium?: number;
  Magnesium?: number;
  ingredients?: string;
  type?: 'food' | 'recipe';
  favorite?: boolean;
  ingredientItems?: RecipeItem[]; 
  tags?: string[];
  isLocal?: boolean;
  barcode?: string;
  brand?: string;
  stagedQty?: string;
  stagedUnit?: string;
  showNutrientIntel?: boolean;
  foodGroup?: FoodGroup;
  [key: string]: any; // Allow for flexible micronutrient keys
}

export interface StagedFood extends Food {
  qty: number;
  unit: string;
  _src?: string;
}
