"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyList } from "@/components/ui/empty-list";
import { PageContainer } from "@/components/ui/page-container";

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
    <PageContainer>
      {logs.length === 0 ? (
        <EmptyList message="No logs yet. Start tracking your activities!" />
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-dashboard-card-border/40 bg-muted/50 text-text transition-all hover:bg-muted/70"
                >
                  <p className="font-semibold text-text">{log.type}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

