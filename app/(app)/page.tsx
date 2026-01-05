"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dayLogRepo } from "@/lib/db/repos/dayLogRepo";
import { db } from "@/lib/db";
import type { DayLog } from "@/lib/db/schema";

export default function Home() {
  const [dayLog, setDayLog] = useState<DayLog | null>(null);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [supplementsTaken, setSupplementsTaken] = useState<number>(0);
  const [totalSupplements, setTotalSupplements] = useState<number>(0);
  const [workoutStatus, setWorkoutStatus] = useState<string>("");
  const [workoutName, setWorkoutName] = useState<string>("");
  const [workoutReps, setWorkoutReps] = useState<number | null>(null);
  const [hasWorkouts, setHasWorkouts] = useState<boolean>(false);
  const [hasMealItems, setHasMealItems] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Load today's day log (create if missing)
        const todayLog = await dayLogRepo.getOrCreateToday();
        setDayLog(todayLog);

        // Calculate total calories from meal items
        let calories = 0;
        let hasItems = false;
        
        for (const meal of todayLog.meals) {
          for (const item of meal.items) {
            hasItems = true;
            if (item.recipeId && item.amountG) {
              try {
                const recipe = await db.recipes.get(item.recipeId);
                if (recipe && recipe.caloriesPer100g) {
                  calories += (recipe.caloriesPer100g * item.amountG) / 100;
                }
              } catch (error) {
                // Recipe not found or missing calories - treat as 0
                console.warn(`Recipe ${item.recipeId} not found or missing calories`);
              }
            }
          }
        }
        
        setTotalCalories(calories);
        setHasMealItems(hasItems);

        // Calculate supplements taken/total
        const allSupplements = await db.supplements.toArray();
        setTotalSupplements(allSupplements.length);
        
        const taken = todayLog.supplements.filter(s => s.taken).length;
        setSupplementsTaken(taken);

        // Get workout status
        const allWorkouts = await db.workouts.toArray();
        setHasWorkouts(allWorkouts.length > 0);
        
        if (todayLog.workout) {
          try {
            const workout = await db.workouts.get(todayLog.workout.workoutId);
            const variant = await db.workout_variants.get(todayLog.workout.variantId);
            
            if (workout && variant) {
              setWorkoutName(workout.name);
              setWorkoutReps(variant.repetitions);
              setWorkoutStatus("completed");
            } else {
              setWorkoutStatus("not_completed");
            }
          } catch (error) {
            setWorkoutStatus("not_completed");
          }
        } else {
          setWorkoutStatus("not_completed");
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calories</CardTitle>
        </CardHeader>
        <CardContent>
          {hasMealItems ? (
            <p className="text-2xl font-semibold">{Math.round(totalCalories)} kcal</p>
          ) : (
            <p className="text-muted-foreground">No meals logged today</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplements</CardTitle>
        </CardHeader>
        <CardContent>
          {totalSupplements > 0 ? (
            <p className="text-2xl font-semibold">
              {supplementsTaken} / {totalSupplements}
            </p>
          ) : (
            <p className="text-muted-foreground">No supplements configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workout</CardTitle>
        </CardHeader>
        <CardContent>
          {workoutStatus === "completed" ? (
            <p className="text-lg font-semibold">
              Completed: {workoutName}
              {workoutReps !== null && ` + ${workoutReps} reps`}
            </p>
          ) : hasWorkouts ? (
            <p className="text-muted-foreground">Not completed</p>
          ) : (
            <p className="text-muted-foreground">No workouts configured</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
