import { db, generateId, getCurrentTimestamp } from "../index";
import type { DayLog, DayMeals, MealType } from "../schema";

/**
 * Helper function to ensure meals array always contains all 4 meal groups
 */
function ensureMealGroups(meals?: DayMeals[]): DayMeals[] {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const existingMeals = meals || [];
  
  // Create a map of existing meals by type
  const mealsByType = new Map<MealType, DayMeals>();
  existingMeals.forEach(meal => {
    mealsByType.set(meal.type, meal);
  });
  
  // Ensure all 4 meal types exist
  return mealTypes.map(type => {
    const existing = mealsByType.get(type);
    return existing || { type, items: [] };
  });
}

/**
 * Normalize a DayLog to ensure it has all required fields (for backward compatibility)
 */
function normalizeDayLog(log: DayLog | undefined): DayLog | undefined {
  if (!log) return undefined;
  
  return {
    ...log,
    meals: ensureMealGroups(log.meals),
    supplements: log.supplements || [],
    workout: log.workout,
  };
}

export const dayLogRepo = {
  /**
   * Get a day log by date (YYYY-MM-DD)
   */
  async getByDate(date: string): Promise<DayLog | undefined> {
    const log = await db.day_logs.where("date").equals(date).first();
    return normalizeDayLog(log);
  },

  /**
   * Get a day log by id
   */
  async getById(id: string): Promise<DayLog | undefined> {
    const log = await db.day_logs.get(id);
    return normalizeDayLog(log);
  },

  /**
   * Get all day logs
   */
  async getAll(): Promise<DayLog[]> {
    const logs = await db.day_logs.toArray();
    return logs.map(log => normalizeDayLog(log)!);
  },

  /**
   * Get day logs for a date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<DayLog[]> {
    const logs = await db.day_logs
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
    return logs.map(log => normalizeDayLog(log)!);
  },

  /**
   * Create a new day log
   */
  async create(data: Partial<Omit<DayLog, "id" | "createdAt" | "updatedAt">>): Promise<DayLog> {
    const now = getCurrentTimestamp();
    const dayLog: DayLog = {
      id: generateId(),
      date: data.date || new Date().toISOString().split("T")[0], // Default to today
      meals: ensureMealGroups(data.meals),
      supplements: data.supplements || [],
      workout: data.workout,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    // Ensure meals are normalized after spread (in case data.meals was provided)
    dayLog.meals = ensureMealGroups(dayLog.meals);

    await db.day_logs.add(dayLog);
    return dayLog;
  },

  /**
   * Update a day log
   */
  async update(id: string, data: Partial<Omit<DayLog, "id" | "createdAt">>): Promise<DayLog> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Day log with id ${id} not found`);
    }

    const updated: DayLog = {
      ...existing,
      ...data,
      meals: data.meals !== undefined ? ensureMealGroups(data.meals) : ensureMealGroups(existing.meals),
      updatedAt: getCurrentTimestamp(),
    };
    await db.day_logs.put(updated);
    return updated;
  },

  /**
   * Delete a day log
   */
  async delete(id: string): Promise<void> {
    await db.day_logs.delete(id);
  },

  /**
   * Get today's day log
   */
  async getToday(): Promise<DayLog | undefined> {
    const today = new Date().toISOString().split("T")[0];
    return await this.getByDate(today);
  },

  /**
   * Create or get today's day log
   */
  async getOrCreateToday(data?: Partial<Omit<DayLog, "id" | "date" | "createdAt" | "updatedAt">>): Promise<DayLog> {
    const today = await this.getToday();
    if (today) {
      return today;
    }
    return await this.create({
      ...data,
      date: new Date().toISOString().split("T")[0],
    });
  },

  /**
   * Get or create a day log by date (YYYY-MM-DD)
   */
  async getOrCreateByDate(date: string, data?: Partial<Omit<DayLog, "id" | "date" | "createdAt" | "updatedAt">>): Promise<DayLog> {
    const existing = await this.getByDate(date);
    if (existing) {
      return existing;
    }
    return await this.create({
      ...data,
      date,
    });
  },

  /**
   * Update a day log by date, creating it if it doesn't exist
   * Safely merges the patch data with existing data
   */
  async updateByDate(date: string, patch: Partial<Omit<DayLog, "id" | "date" | "createdAt" | "updatedAt">>): Promise<DayLog> {
    const existing = await this.getByDate(date);
    
    if (!existing) {
      // Create new day log with patch data
      return await this.create({
        ...patch,
        date,
      });
    }

    // Merge patch with existing data
    const merged: DayLog = {
      ...existing,
      ...patch,
      meals: patch.meals !== undefined ? ensureMealGroups(patch.meals) : ensureMealGroups(existing.meals),
      updatedAt: getCurrentTimestamp(),
    };
    
    await db.day_logs.put(merged);
    return merged;
  },
};


