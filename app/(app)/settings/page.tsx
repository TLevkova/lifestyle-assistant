"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportData, importData } from "@/lib/db-utils";

export default function SettingsPage() {
  const [importStatus, setImportStatus] = useState<string>("");

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
    </div>
  );
}

