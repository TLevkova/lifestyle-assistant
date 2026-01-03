import Dexie, { type Table } from "dexie";
import type {
  Profile,
  Workout,
  WorkoutVariant,
  Exercise,
  Recipe,
  Meal,
  DayLog,
  Supplement,
  SupplementIntake,
  Log,
} from "./schema";

export class LifestyleDB extends Dexie {
  profile!: Table<Profile, string>;
  workouts!: Table<Workout, string>;
  workout_variants!: Table<WorkoutVariant, string>;
  exercises!: Table<Exercise, string>;
  recipes!: Table<Recipe, string>;
  meals!: Table<Meal, string>;
  day_logs!: Table<DayLog, string>;
  supplements!: Table<Supplement, string>;
  supplement_intakes!: Table<SupplementIntake, string>;
  logs!: Table<Log, number>; // Legacy table for backward compatibility

  constructor() {
    super("LifestyleAssistantDB");
    
    // Version 1: Legacy schema with just logs
    this.version(1).stores({
      logs: "++id, type, timestamp",
    });

    // Version 2: New schema with all tables
    this.version(2).stores({
      profile: "id, createdAt, updatedAt",
      workouts: "id, createdAt, updatedAt",
      workout_variants: "id, workoutId, createdAt, updatedAt",
      exercises: "id, createdAt, updatedAt",
      recipes: "id, createdAt, updatedAt",
      meals: "id, recipeId, createdAt, updatedAt",
      day_logs: "id, date, createdAt, updatedAt",
      supplements: "id, createdAt, updatedAt",
      supplement_intakes: "id, supplementId, createdAt, updatedAt",
      logs: "++id, type, timestamp", // Keep legacy logs table
    });
  }
}

export const db = new LifestyleDB();

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current ISO timestamp
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

