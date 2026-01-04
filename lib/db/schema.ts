// Database schema types

export interface Profile {
  id: string; // Fixed to "1" for single user
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  // Add more profile fields as needed
  [key: string]: any;
}

export interface Workout {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  // Add more workout fields as needed
  [key: string]: any;
}

export interface WorkoutVariant {
  id: string;
  workoutId: string; // Foreign key to workouts
  createdAt: string;
  updatedAt: string;
  repetitions: number;
  breakBetweenExercisesSec: number;
  breakBetweenSetsSec: number;
  // Add more variant fields as needed
  [key: string]: any;
}

export interface Exercise {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  // Add more exercise fields as needed
  [key: string]: any;
}

export interface Recipe {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  // Nutrition per 100g
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  // Add more recipe fields as needed
  [key: string]: any;
}

export interface Meal {
  id: string;
  recipeId?: string; // Foreign key to recipes (optional)
  createdAt: string;
  updatedAt: string;
  name: string;
  // Amount in grams or ml
  amountG?: number;
  amountMl?: number;
  // Add more meal fields as needed
  [key: string]: any;
}

// MVP Daily State Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DayMealItem {
  recipeId: string;
  amountG?: number;
  amountMl?: number;
}

export interface DayMeals {
  type: MealType;
  items: DayMealItem[];
}

export interface DaySupplementState {
  supplementId: string;
  taken: boolean;
}

export interface DayWorkoutState {
  workoutId: string;
  variantId: string;
}

export interface DayLog {
  id: string;
  date: string; // YYYY-MM-DD format
  createdAt: string;
  updatedAt: string;
  meals: DayMeals[];
  supplements: DaySupplementState[];
  workout?: DayWorkoutState;
}

export interface Supplement {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  // Add more supplement fields as needed
  [key: string]: any;
}

export interface SupplementIntake {
  id: string;
  supplementId: string; // Foreign key to supplements
  createdAt: string;
  updatedAt: string;
  // Add intake-specific fields (e.g., amount, time)
  [key: string]: any;
}

// Legacy log interface for backward compatibility
export interface Log {
  id?: number;
  type: string;
  timestamp: number;
  data?: any;
}

