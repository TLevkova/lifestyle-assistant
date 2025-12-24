import { db } from "./db";

export async function exportData(): Promise<void> {
  const logs = await db.logs.toArray();
  const data = {
    version: 1,
    exportDate: new Date().toISOString(),
    logs,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lifestyle-assistant-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data.logs || !Array.isArray(data.logs)) {
          throw new Error("Invalid file format");
        }

        await db.transaction("rw", db.logs, async () => {
          await db.logs.clear();
          await db.logs.bulkAdd(data.logs);
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

