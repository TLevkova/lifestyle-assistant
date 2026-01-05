"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export default function LogPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const allLogs = await db.logs.toArray();
        setLogs(allLogs);
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground">
              No logs yet. Start tracking your activities!
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-muted rounded-lg text-text">
                  <p className="font-semibold">{log.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

