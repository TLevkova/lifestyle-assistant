// Re-export from the new database structure for backward compatibility
export { db, generateId, getCurrentTimestamp } from "./db/index";
export type { Log } from "./db/schema";

