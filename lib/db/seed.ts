import { db, generateId, getCurrentTimestamp } from "./index";
import { profileRepo } from "./repos/profileRepo";
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
} from "./schema";

/**
 * Seed the database with sample data (optional)
 * Call this function to populate the database with initial data for testing
 */
export async function seedDatabase(): Promise<void> {
  // Seed profile
  await profileRepo.upsert({
    // Add profile fields as needed
  });

  // Seed sample workouts
  const workout1: Workout = {
    id: generateId(),
    name: "Morning Routine",
    description: "Quick morning workout",
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.workouts.add(workout1);

  // Seed sample workout variant
  const variant1: WorkoutVariant = {
    id: generateId(),
    workoutId: workout1.id,
    repetitions: 3,
    breakBetweenExercisesSec: 60,
    breakBetweenSetsSec: 30,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.workout_variants.add(variant1);

  // Seed sample exercise
  const exercise1: Exercise = {
    id: generateId(),
    name: "Push-ups",
    description: "Standard push-ups",
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.exercises.add(exercise1);

  // Seed sample recipe
  const recipe1: Recipe = {
    id: generateId(),
    name: "Chicken Breast",
    description: "Grilled chicken breast",
    totalCalories: 165,
    totalProtein: 31,
    totalCarbs: 0,
    totalFat: 3.6,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.recipes.add(recipe1);

  // Seed sample meal
  const meal1: Meal = {
    id: generateId(),
    recipeId: recipe1.id,
    name: "Lunch - Chicken Breast",
    amountG: 200,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.meals.add(meal1);

  // Seed sample supplement
  const supplement1: Supplement = {
    id: generateId(),
    name: "Vitamin D",
    description: "Daily vitamin D supplement",
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.supplements.add(supplement1);

  // Seed sample supplement intake
  const intake1: SupplementIntake = {
    id: generateId(),
    supplementId: supplement1.id,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.supplement_intakes.add(intake1);

  // Seed today's day log
  const today = new Date().toISOString().split("T")[0];
  const dayLog1: DayLog = {
    id: generateId(),
    date: today,
    meals: [
      { type: 'breakfast', items: [] },
      { type: 'lunch', items: [] },
      { type: 'dinner', items: [] },
      { type: 'snacks', items: [] },
    ],
    supplements: [],
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
  await db.day_logs.add(dayLog1);

  console.log("Database seeded successfully!");
}


