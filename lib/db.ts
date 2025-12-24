import Dexie, { type Table } from "dexie";

export interface Log {
  id?: number;
  type: string;
  timestamp: number;
  data?: any;
}

export class LifestyleDB extends Dexie {
  logs!: Table<Log>;

  constructor() {
    super("LifestyleAssistantDB");
    this.version(1).stores({
      logs: "++id, type, timestamp",
    });
  }
}

export const db = new LifestyleDB();

