"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useLiveQuery } from "@/lib/hooks/useLiveQuery";
import { db } from "@/lib/db";
import { dayLogRepo } from "@/lib/db/repos/dayLogRepo";
import type { DayLogSupplementEntry } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyList } from "@/components/ui/empty-list";
import { PageContainer } from "@/components/ui/page-container";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Build supplements array for day log: one entry per catalog supplement, no duplicates, only catalog ids. */
function syncDayLogSupplements(
  catalogIds: string[],
  existing: DayLogSupplementEntry[]
): DayLogSupplementEntry[] {
  const byId = new Map<string, boolean>();
  for (const e of existing) {
    if (catalogIds.includes(e.supplementId)) byId.set(e.supplementId, e.taken);
  }
  return catalogIds.map((supplementId) => ({
    supplementId,
    taken: byId.get(supplementId) ?? false,
  }));
}

export default function LogPage() {
  const [legacyLogs, setLegacyLogs] = useState<any[]>([]);

  const supplements = useLiveQuery(() =>
    db.supplements.orderBy("updatedAt").reverse().toArray()
  );
  const todayLog = useLiveQuery(() => dayLogRepo.getOrCreateToday(), []);

  const todayDate = getTodayDate();

  const syncedSupplements = useMemo(() => {
    if (supplements === undefined || todayLog === undefined) return undefined;
    const catalogIds = supplements.map((s) => s.id);
    return syncDayLogSupplements(catalogIds, todayLog.supplements);
  }, [supplements, todayLog]);

  // Persist synced state when it differs from stored
  useEffect(() => {
    if (
      todayLog === undefined ||
      syncedSupplements === undefined ||
      supplements === undefined
    )
      return;

    const same =
      syncedSupplements.length === todayLog.supplements.length &&
      syncedSupplements.every(
        (e, i) =>
          todayLog.supplements[i]?.supplementId === e.supplementId &&
          todayLog.supplements[i]?.taken === e.taken
      );
    if (same) return;

    dayLogRepo
      .updateByDate(todayDate, { supplements: syncedSupplements })
      .catch(() => toast.error("Failed to sync supplements"));
  }, [todayDate, todayLog, syncedSupplements, supplements]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const allLogs = await db.logs.toArray();
        setLegacyLogs(allLogs);
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    }
    loadLogs();
  }, []);

  const handleToggle = async (supplementId: string, taken: boolean) => {
    if (syncedSupplements === undefined) return;
    const next = syncedSupplements.map((e) =>
      e.supplementId === supplementId ? { ...e, taken } : e
    );
    try {
      await dayLogRepo.updateByDate(todayDate, { supplements: next });
    } catch {
      toast.error("Failed to update");
    }
  };

  const catalogList = supplements ?? [];
  const checklistEntries = syncedSupplements ?? [];

  return (
    <PageContainer>
      {/* Today – supplements intake */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today – Supplements</CardTitle>
        </CardHeader>
        <CardContent>
          {supplements === undefined || todayLog === undefined ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : catalogList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add supplements in the Supplements catalog to track them here.
            </p>
          ) : (
            <ul className="space-y-2">
              {checklistEntries.map((entry) => {
                const sup = catalogList.find((s) => s.id === entry.supplementId);
                return (
                  <li
                    key={entry.supplementId}
                    className="flex items-center gap-3 rounded-md border border-dashboard-card-border/60 bg-dashboard-card-bg px-3 py-2"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={entry.taken}
                      onClick={() =>
                        handleToggle(entry.supplementId, !entry.taken)
                      }
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-primary bg-background transition-colors aria-checked:bg-primary aria-checked:border-primary"
                    >
                      {entry.taken && (
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={
                        entry.taken
                          ? "text-muted-foreground line-through"
                          : "text-text"
                      }
                    >
                      {sup?.name ?? entry.supplementId}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Legacy activity logs */}
      <h2 className="text-xl font-semibold mb-4">Activity log</h2>
      {legacyLogs.length === 0 ? (
        <EmptyList message="No activity logs yet." />
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="space-y-3">
              {legacyLogs.map((log) => (
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
