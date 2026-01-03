"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportData, importData } from "@/lib/db-utils";
import { dayLogRepo } from "@/lib/db/repos/dayLogRepo";
import type { DayLog } from "@/lib/db/schema";

export default function SettingsPage() {
  const [importStatus, setImportStatus] = useState<string>("");
  const [dbTestStatus, setDbTestStatus] = useState<string>("");
  const [todayLogs, setTodayLogs] = useState<DayLog[]>([]);

  const handleExport = async () => {
    try {
      await exportData();
      setImportStatus("Data exported successfully!");
    } catch (error) {
      setImportStatus("Export failed. Please try again.");
      console.error("Export error:", error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importData(file);
      setImportStatus("Data imported successfully!");
      window.location.reload();
    } catch (error) {
      setImportStatus("Import failed. Please check the file format.");
      console.error("Import error:", error);
    }
  };

  const handleCreateSampleDayLog = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const dayLog = await dayLogRepo.create({
        date: today,
      });
      setDbTestStatus(`Created day log with id: ${dayLog.id}`);
      // Refresh today's logs
      await handleListToday();
    } catch (error) {
      setDbTestStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error("Create day log error:", error);
    }
  };

  const handleListToday = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const logs = await dayLogRepo.getByDateRange(today, today);
      setTodayLogs(logs);
      setDbTestStatus(`Found ${logs.length} day log(s) for today`);
    } catch (error) {
      setDbTestStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error("List today error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>

        <div className="space-y-4">
          <div>
            <Button onClick={handleExport} className="w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Download your data as a JSON file
            </p>
          </div>

          <div>
            <label htmlFor="import-file" className="inline-block cursor-pointer">
              <Button variant="secondary" type="button">
                <Upload className="h-4 w-4" />
                Import Data
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <p className="text-sm text-muted-foreground mt-2">
              Import data from a JSON file
            </p>
          </div>

          {importStatus && (
            <p className="text-sm text-muted-foreground">{importStatus}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">DB Smoke Test</h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleCreateSampleDayLog} className="w-full sm:w-auto">
              Create sample day log
            </Button>
            <Button onClick={handleListToday} variant="secondary" className="w-full sm:w-auto">
              List today
            </Button>
          </div>

          {dbTestStatus && (
            <p className="text-sm text-muted-foreground">{dbTestStatus}</p>
          )}

          {todayLogs.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Today&apos;s Logs:</h3>
              <div className="space-y-2">
                {todayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-md border border-border bg-muted/50 text-sm"
                  >
                    <div className="font-mono">
                      <div>ID: {log.id}</div>
                      <div>Date: {log.date}</div>
                      <div>Created: {new Date(log.createdAt).toLocaleString()}</div>
                      <div>Updated: {new Date(log.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

