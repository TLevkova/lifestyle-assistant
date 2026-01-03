import { db, generateId, getCurrentTimestamp } from "../index";
import type { Profile } from "../schema";

const PROFILE_ID = "1";

export const profileRepo = {
  /**
   * Get the profile (always id="1")
   */
  async get(): Promise<Profile | undefined> {
    return await db.profile.get(PROFILE_ID);
  },

  /**
   * Create or update the profile
   */
  async upsert(data: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">>): Promise<Profile> {
    const existing = await this.get();
    const now = getCurrentTimestamp();

    if (existing) {
      // Update existing profile
      const updated: Profile = {
        ...existing,
        ...data,
        updatedAt: now,
      };
      await db.profile.put(updated);
      return updated;
    } else {
      // Create new profile
      const newProfile: Profile = {
        id: PROFILE_ID,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await db.profile.add(newProfile);
      return newProfile;
    }
  },

  /**
   * Update the profile
   */
  async update(data: Partial<Omit<Profile, "id" | "createdAt">>): Promise<Profile> {
    const existing = await this.get();
    if (!existing) {
      throw new Error("Profile not found. Use upsert to create it first.");
    }

    const updated: Profile = {
      ...existing,
      ...data,
      updatedAt: getCurrentTimestamp(),
    };
    await db.profile.put(updated);
    return updated;
  },
};


