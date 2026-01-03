"use client";

import { useState, useRef } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exportDatabase, importDatabase } from "@/lib/db/backup";
import { toast } from "sonner";
import { dayLogRepo } from "@/lib/db/repos/dayLogRepo";
import type { DayLog } from "@/lib/db/schema";
import { unregisterAllServiceWorkers } from "@/components/pwa/sw-register";

export default function SettingsPage() {
  const [dbTestStatus, setDbTestStatus] = useState<string>("");
  const [todayLogs, setTodayLogs] = useState<DayLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportDatabase();
      toast.success("Database exported successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed. Please try again.";
      toast.error(errorMessage);
      console.error("Export error:", error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Confirm overwrite
    const confirmed = window.confirm(
      "This will overwrite your current database. All existing data will be replaced. Continue?"
    );
    if (!confirmed) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      await importDatabase(file);
      toast.success("Database imported successfully!");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Reload to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Import failed. Please check the file format.";
      toast.error(errorMessage);
      console.error("Import error:", error);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const handleCleanupServiceWorkers = async () => {
    const confirmed = window.confirm(
      "This will unregister ALL service workers and clear ALL caches. The page will reload after cleanup. Continue?"
    );
    if (!confirmed) return;

    try {
      const result = await unregisterAllServiceWorkers();
      toast.success(
        `Cleaned up ${result.unregistered} service worker(s) and ${result.cachesCleared} cache(s)`
      );
      // Reload after a short delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Cleanup failed";
      toast.error(errorMessage);
      console.error("Service worker cleanup error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync & Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Sync: </span>
            <span>not enabled (Phase 4)</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Last local backup: </span>
            <span>unknown</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Backup</CardTitle>
          <CardDescription>
            Export your entire database as JSON or import from a backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button onClick={handleExport} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <p className="text-sm text-muted-foreground">
              Downloads a file like fitness-pwa-backup-YYYY-MM-DD.json with all tables and records
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={handleImportClick}
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Import data from a JSON backup file. This will replace your current database.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Worker</CardTitle>
          <CardDescription>
            Clean up old or stuck service workers (development only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              variant="destructive"
              onClick={handleCleanupServiceWorkers}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Unregister All Service Workers
            </Button>
            <p className="text-sm text-muted-foreground">
              Removes all service worker registrations and clears all caches. Useful when you have stuck or stopped service workers.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DB Smoke Test</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}

