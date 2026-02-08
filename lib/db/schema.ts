// Database entity types (used by lib/db/index.ts and repos)

export interface Log {
  id?: number;
  type: string;
  timestamp: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface DayMealItem {
  recipeId?: string;
  [key: string]: unknown;
}

export interface DayMeals {
  type: MealType;
  items: DayMealItem[];
}

export interface DayLogSupplementEntry {
  supplementId: string;
  taken: boolean;
}

export interface DayLogWorkout {
  workoutId: string;
  variantId: string;
  [key: string]: unknown;
}

export interface DayLog {
  id: string;
  date: string;
  meals: DayMeals[];
  supplements: DayLogSupplementEntry[];
  workout?: DayLogWorkout;
  createdAt: string;
  updatedAt: string;
}

export interface Supplement {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplementIntake {
  id: string;
  supplementId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  [key: string]: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workout {
  id: string;
  [key: string]: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutVariant {
  id: string;
  [key: string]: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface Exercise {
  id: string;
  [key: string]: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipeMeasurement {
  productName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  description?: string;
  imageUrl?: string;
  measurements?: RecipeMeasurement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Meal {
  id: string;
  [key: string]: unknown;
  createdAt?: string;
  updatedAt?: string;
}
