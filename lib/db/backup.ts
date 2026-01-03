import { db } from "./index";

/**
 * Database Backup & Restore Module
 * 
 * This module provides functionality to export and import the entire database
 * as JSON files. Useful for backing up data or migrating between devices.
 * 
 * **Export Format:** Always uses the new format:
 * - schemaVersion: 1 (not "version")
 * - exportedAt: ISO 8601 string (not "exportDate")
 * - data: object containing all tables (not just "logs")
 * 
 * **Import:** Supports both old and new formats with automatic migration.
 * 
 * @see docs/BACKUP_TESTING.md for detailed testing instructions
 */

/**
 * Current backup schema version
 * Always use this constant to ensure consistency
 */
const BACKUP_SCHEMA_VERSION = 1;

/**
 * Backup data structure
 * 
 * Format: { schemaVersion: 1, exportedAt: ISO string, data: { tableName: [...] } }
 */
export interface BackupData {
  schemaVersion: number;
  exportedAt: string;
  data: {
    profile?: any[];
    workouts?: any[];
    workout_variants?: any[];
    exercises?: any[];
    recipes?: any[];
    meals?: any[];
    day_logs?: any[];
    supplements?: any[];
    supplement_intakes?: any[];
    logs?: any[];
  };
}

/**
 * Migrates old backup format to new format
 * 
 * Old format: { version: 1, exportDate: string, logs: [...] }
 * New format: { schemaVersion: 1, exportedAt: string, data: { logs: [...] } }
 */
function migrateOldFormat(data: any): BackupData {
  // Check if it's the old format
  if (data.version && data.exportDate && data.logs && !data.schemaVersion) {
      return {
        schemaVersion: BACKUP_SCHEMA_VERSION, // Migrate to new format
        exportedAt: data.exportDate,
        data: {
        logs: Array.isArray(data.logs) ? data.logs : [],
        // Other tables will be empty arrays
        profile: [],
        workouts: [],
        workout_variants: [],
        exercises: [],
        recipes: [],
        meals: [],
        day_logs: [],
        supplements: [],
        supplement_intakes: [],
      },
    };
  }
  return data;
}

/**
 * Validates and migrates backup data structure
 * 
 * Ensures the imported file has the correct format before attempting to restore.
 * Supports both old format (version/exportDate/logs) and new format (schemaVersion/exportedAt/data).
 * 
 * @returns Migrated and validated backup data
 * @throws Error with descriptive message if validation fails
 * 
 * Error Messages:
 * - "Invalid JSON format" - File is not valid JSON
 * - "Invalid backup format: must be an object" - Root is not an object
 * - "Invalid backup format: missing schemaVersion" - Missing version field (after migration)
 * - "Invalid backup format: missing exportedAt" - Missing timestamp field (after migration)
 * - "Invalid backup format: missing data" - Missing data object (after migration)
 * - "Unsupported schema version: X" - Schema version doesn't match (expected: 1)
 */
function validateAndMigrateBackupData(data: any): BackupData {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid backup format: must be an object");
  }

  // Migrate old format to new format
  const migratedData = migrateOldFormat(data);

  if (typeof migratedData.schemaVersion !== "number") {
    throw new Error("Invalid backup format: missing schemaVersion");
  }

  if (migratedData.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${migratedData.schemaVersion}. Expected: ${BACKUP_SCHEMA_VERSION}`);
  }

  if (typeof migratedData.exportedAt !== "string") {
    throw new Error("Invalid backup format: missing exportedAt");
  }

  if (typeof migratedData.data !== "object" || migratedData.data === null) {
    throw new Error("Invalid backup format: missing data");
  }

  return migratedData;
}

/**
 * Creates a properly formatted backup data structure
 * 
 * Ensures all exports use the correct format: { schemaVersion: 1, exportedAt: ISO string, data: {...} }
 * This function guarantees type safety and format consistency.
 * 
 * **Important:** This function ALWAYS uses the new format:
 * - schemaVersion (not "version")
 * - exportedAt (not "exportDate")
 * - data object with all tables (not just "logs")
 */
function createBackupData(data: BackupData["data"]): BackupData {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION, // Always use the constant to ensure consistency
    exportedAt: new Date().toISOString(), // Always use ISO 8601 format
    data: {
      // Ensure all tables are included, even if empty
      profile: data.profile ?? [],
      workouts: data.workouts ?? [],
      workout_variants: data.workout_variants ?? [],
      exercises: data.exercises ?? [],
      recipes: data.recipes ?? [],
      meals: data.meals ?? [],
      day_logs: data.day_logs ?? [],
      supplements: data.supplements ?? [],
      supplement_intakes: data.supplement_intakes ?? [],
      logs: data.logs ?? [],
    },
  };
}

/**
 * Exports all database tables to a JSON backup file
 * 
 * Exports all tables (profile, workouts, exercises, recipes, meals, day_logs,
 * supplements, supplement_intakes, logs) in a single transaction to ensure
 * data consistency.
 * 
 * **Format Guarantee:** Always exports in the new format:
 * - schemaVersion: 1 (not "version")
 * - exportedAt: ISO 8601 string (not "exportDate")
 * - data: object with all tables (not just "logs")
 * 
 * File naming: fitness-pwa-backup-YYYY-MM-DD.json (e.g., fitness-pwa-backup-2024-01-15.json)
 * 
 * @throws Error if export fails (e.g., database locked, transaction error)
 * 
 * Example usage:
 * ```ts
 * try {
 *   await exportDatabase();
 *   // File downloads automatically
 * } catch (error) {
 *   console.error("Export failed:", error);
 * }
 * ```
 */
export async function exportDatabase(): Promise<void> {
  // Collect all data from all tables in a single transaction
  const tableData: BackupData["data"] = await db.transaction("r", db.tables, async () => {
    // Export all tables - ensure we get arrays even if tables are empty
    return {
      profile: await db.profile.toArray(),
      workouts: await db.workouts.toArray(),
      workout_variants: await db.workout_variants.toArray(),
      exercises: await db.exercises.toArray(),
      recipes: await db.recipes.toArray(),
      meals: await db.meals.toArray(),
      day_logs: await db.day_logs.toArray(),
      supplements: await db.supplements.toArray(),
      supplement_intakes: await db.supplement_intakes.toArray(),
      logs: await db.logs.toArray(),
    };
  });

  // Create properly formatted backup data structure
  // This ensures we always use schemaVersion, exportedAt, and data (not the old format)
  const backupData = createBackupData(tableData);

  // Validate the structure before exporting (safety check)
  // This ensures we never accidentally export in the wrong format
  if (backupData.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Invalid export: schemaVersion must be ${BACKUP_SCHEMA_VERSION}, got ${backupData.schemaVersion}`);
  }
  if (!backupData.exportedAt || typeof backupData.exportedAt !== "string") {
    throw new Error("Invalid export: exportedAt must be a valid ISO string");
  }
  if (!backupData.data || typeof backupData.data !== "object") {
    throw new Error("Invalid export: data must be an object");
  }

  // Create blob and download
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Generate filename with date: fitness-pwa-backup-YYYY-MM-DD.json
  const today = new Date().toISOString().split("T")[0];
  const filename = `fitness-pwa-backup-${today}.json`;

  // Trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports database from a JSON backup file
 * 
 * ⚠️ WARNING: This is a destructive operation!
 * - Clears ALL existing data in ALL tables
 * - Then imports data from the backup file
 * - Cannot be undone (always export before importing!)
 * 
 * Process:
 * 1. Reads and parses the JSON file
 * 2. Validates the backup structure (schemaVersion, exportedAt, data)
 * 3. Clears all tables in a transaction
 * 4. Bulk imports data from the backup
 * 
 * @param file - The JSON backup file to import
 * @throws Error if:
 *   - File is empty or cannot be read
 *   - JSON is invalid or malformed
 *   - Backup structure is invalid (see validateBackupData)
 *   - Database transaction fails
 * 
 * Example usage:
 * ```ts
 * const fileInput = document.querySelector('input[type="file"]');
 * fileInput.addEventListener('change', async (e) => {
 *   const file = e.target.files[0];
 *   if (file) {
 *     try {
 *       await importDatabase(file);
 *       // Success - data restored
 *     } catch (error) {
 *       // Handle error (show toast, etc.)
 *     }
 *   }
 * });
 * ```
 */
export async function importDatabase(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Parse JSON
        const text = e.target?.result as string;
        if (!text) {
          throw new Error("File is empty");
        }

        let parsedData: any;
        try {
          parsedData = JSON.parse(text);
        } catch (parseError) {
          throw new Error("Invalid JSON format");
        }

        // Migrate old format if needed, then validate structure
        const validatedData = validateAndMigrateBackupData(parsedData);

        // Import in a transaction: clear all tables, then bulk add
        await db.transaction("rw", db.tables, async () => {
          // Clear all tables
          await db.profile.clear();
          await db.workouts.clear();
          await db.workout_variants.clear();
          await db.exercises.clear();
          await db.recipes.clear();
          await db.meals.clear();
          await db.day_logs.clear();
          await db.supplements.clear();
          await db.supplement_intakes.clear();
          await db.logs.clear();

          // Import data (only if arrays exist and are non-empty)
          // Use validated data which is guaranteed to have the correct structure
          const { data } = validatedData;

          if (data.profile && Array.isArray(data.profile) && data.profile.length > 0) {
            await db.profile.bulkAdd(data.profile);
          }
          if (data.workouts && Array.isArray(data.workouts) && data.workouts.length > 0) {
            await db.workouts.bulkAdd(data.workouts);
          }
          if (data.workout_variants && Array.isArray(data.workout_variants) && data.workout_variants.length > 0) {
            await db.workout_variants.bulkAdd(data.workout_variants);
          }
          if (data.exercises && Array.isArray(data.exercises) && data.exercises.length > 0) {
            await db.exercises.bulkAdd(data.exercises);
          }
          if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
            await db.recipes.bulkAdd(data.recipes);
          }
          if (data.meals && Array.isArray(data.meals) && data.meals.length > 0) {
            await db.meals.bulkAdd(data.meals);
          }
          if (data.day_logs && Array.isArray(data.day_logs) && data.day_logs.length > 0) {
            await db.day_logs.bulkAdd(data.day_logs);
          }
          if (data.supplements && Array.isArray(data.supplements) && data.supplements.length > 0) {
            await db.supplements.bulkAdd(data.supplements);
          }
          if (data.supplement_intakes && Array.isArray(data.supplement_intakes) && data.supplement_intakes.length > 0) {
            await db.supplement_intakes.bulkAdd(data.supplement_intakes);
          }
          if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
            await db.logs.bulkAdd(data.logs);
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

