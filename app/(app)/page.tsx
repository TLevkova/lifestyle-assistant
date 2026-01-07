"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { dayLogRepo } from "@/lib/db/repos/dayLogRepo";
import { db } from "@/lib/db";
import type { DayLog } from "@/lib/db/schema";

interface DashboardData {
  dayLog: DayLog | null;
  totalCalories: number;
  supplementsTaken: number;
  totalSupplements: number;
  workoutStatus: string;
  workoutName: string;
  workoutReps: number | null;
  hasWorkouts: boolean;
  hasMealItems: boolean;
  lastUpdated: number;
}

// Cache dashboard data in module scope to persist across navigation
let cachedDashboardData: DashboardData | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export default function Home() {
  const [dayLog, setDayLog] = useState<DayLog | null>(cachedDashboardData?.dayLog ?? null);
  const [totalCalories, setTotalCalories] = useState<number>(cachedDashboardData?.totalCalories ?? 0);
  const [supplementsTaken, setSupplementsTaken] = useState<number>(cachedDashboardData?.supplementsTaken ?? 0);
  const [totalSupplements, setTotalSupplements] = useState<number>(cachedDashboardData?.totalSupplements ?? 0);
  const [workoutStatus, setWorkoutStatus] = useState<string>(cachedDashboardData?.workoutStatus ?? "");
  const [workoutName, setWorkoutName] = useState<string>(cachedDashboardData?.workoutName ?? "");
  const [workoutReps, setWorkoutReps] = useState<number | null>(cachedDashboardData?.workoutReps ?? null);
  const [hasWorkouts, setHasWorkouts] = useState<boolean>(cachedDashboardData?.hasWorkouts ?? false);
  const [hasMealItems, setHasMealItems] = useState<boolean>(cachedDashboardData?.hasMealItems ?? false);
  const [loading, setLoading] = useState<boolean>(!cachedDashboardData);
  const isLoadingRef = useRef<boolean>(false);

  const loadDashboard = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) return;
    
    // Check cache validity
    const now = Date.now();
    if (cachedDashboardData && (now - cachedDashboardData.lastUpdated) < CACHE_DURATION) {
      // Use cached data
      setDayLog(cachedDashboardData.dayLog);
      setTotalCalories(cachedDashboardData.totalCalories);
      setSupplementsTaken(cachedDashboardData.supplementsTaken);
      setTotalSupplements(cachedDashboardData.totalSupplements);
      setWorkoutStatus(cachedDashboardData.workoutStatus);
      setWorkoutName(cachedDashboardData.workoutName);
      setWorkoutReps(cachedDashboardData.workoutReps);
      setHasWorkouts(cachedDashboardData.hasWorkouts);
      setHasMealItems(cachedDashboardData.hasMealItems);
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);

    try {
      // Load today's day log (create if missing)
      const todayLog = await dayLogRepo.getOrCreateToday();

      // Calculate total calories from meal items
      let calories = 0;
      let hasItems = false;
      
      for (const meal of todayLog.meals) {
        for (const item of meal.items) {
          hasItems = true;
          if (item.recipeId) {
            try {
              const recipe = await db.recipes.get(item.recipeId);
              if (recipe && recipe.totalCalories) {
                calories += recipe.totalCalories;
              }
            } catch (error) {
              // Recipe not found or missing calories - treat as 0
              console.warn(`Recipe ${item.recipeId} not found or missing calories`);
            }
          }
        }
      }

      // Calculate supplements taken/total
      const allSupplements = await db.supplements.toArray();
      const totalSupps = allSupplements.length;
      const taken = todayLog.supplements.filter(s => s.taken).length;

      // Get workout status
      const allWorkouts = await db.workouts.toArray();
      const hasW = allWorkouts.length > 0;
      
      let wStatus = "not_completed";
      let wName = "";
      let wReps: number | null = null;
      
      if (todayLog.workout) {
        try {
          const workout = await db.workouts.get(todayLog.workout.workoutId);
          const variant = await db.workout_variants.get(todayLog.workout.variantId);
          
          if (workout && variant) {
            wName = workout.name;
            wReps = variant.repetitions;
            wStatus = "completed";
          }
        } catch (error) {
          // Keep default values
        }
      }

      // Update state
      setDayLog(todayLog);
      setTotalCalories(calories);
      setHasMealItems(hasItems);
      setTotalSupplements(totalSupps);
      setSupplementsTaken(taken);
      setHasWorkouts(hasW);
      setWorkoutStatus(wStatus);
      setWorkoutName(wName);
      setWorkoutReps(wReps);

      // Cache the data
      cachedDashboardData = {
        dayLog: todayLog,
        totalCalories: calories,
        supplementsTaken: taken,
        totalSupplements: totalSupps,
        workoutStatus: wStatus,
        workoutName: wName,
        workoutReps: wReps,
        hasWorkouts: hasW,
        hasMealItems: hasItems,
        lastUpdated: now,
      };
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Refresh data when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Invalidate cache and reload if page was hidden for more than cache duration
        const now = Date.now();
        if (!cachedDashboardData || (now - cachedDashboardData.lastUpdated) >= CACHE_DURATION) {
          cachedDashboardData = null;
          loadDashboard();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadDashboard]);

  // Export cache invalidation function for use in other components if needed
  useEffect(() => {
    // Make cache invalidation available globally for when data changes
    (window as any).__invalidateDashboardCache = () => {
      cachedDashboardData = null;
      loadDashboard();
    };
    
    return () => {
      delete (window as any).__invalidateDashboardCache;
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState variant="dashboard" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardCard title="Calories">
        {hasMealItems ? (
          <p className="text-3xl font-bold text-text">{Math.round(totalCalories)}</p>
        ) : (
          <p className="text-base text-muted-foreground">No meals logged today</p>
        )}
      </DashboardCard>

      <DashboardCard title="Supplements">
        {totalSupplements > 0 ? (
          <div>
            <p className="text-3xl font-bold text-text">
              {supplementsTaken} / {totalSupplements}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-dashboard-card-accent transition-all"
                style={{
                  width: `${totalSupplements > 0 ? (supplementsTaken / totalSupplements) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-base text-muted-foreground">No supplements configured</p>
        )}
      </DashboardCard>

      <DashboardCard title="Workout">
        {workoutStatus === "completed" ? (
          <div>
            <p className="text-xl font-bold text-text">
              Completed: {workoutName}
              {workoutReps !== null && ` + ${workoutReps} reps`}
            </p>
          </div>
        ) : hasWorkouts ? (
          <p className="text-base text-muted-foreground">Not completed</p>
        ) : (
          <p className="text-base text-muted-foreground">No workouts configured</p>
        )}
      </DashboardCard>
    </PageContainer>
  );
}
