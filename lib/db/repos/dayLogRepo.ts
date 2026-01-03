import { db, generateId, getCurrentTimestamp } from "../index";
import type { DayLog } from "../schema";

export const dayLogRepo = {
  /**
   * Get a day log by date (YYYY-MM-DD)
   */
  async getByDate(date: string): Promise<DayLog | undefined> {
    return await db.day_logs.where("date").equals(date).first();
  },

  /**
   * Get a day log by id
   */
  async getById(id: string): Promise<DayLog | undefined> {
    return await db.day_logs.get(id);
  },

  /**
   * Get all day logs
   */
  async getAll(): Promise<DayLog[]> {
    return await db.day_logs.toArray();
  },

  /**
   * Get day logs for a date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<DayLog[]> {
    return await db.day_logs
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
  },

  /**
   * Create a new day log
   */
  async create(data: Partial<Omit<DayLog, "id" | "createdAt" | "updatedAt">>): Promise<DayLog> {
    const now = getCurrentTimestamp();
    const dayLog: DayLog = {
      id: generateId(),
      date: data.date || new Date().toISOString().split("T")[0], // Default to today
      ...data,
      createdAt: now,
      updatedAt: now,
    } as DayLog;

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
};


