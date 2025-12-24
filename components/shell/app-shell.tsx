"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/workouts": "Workouts",
  "/food": "Food",
  "/supplements": "Supplements",
  "/log": "Activity Log",
  "/settings": "Settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pageTitles[pathname ?? "/"] ?? "Lifestyle Assistant";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-screen-sm">
          <div className="flex h-14 items-center px-4">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-screen-sm">
          <div className="px-4 py-6">{children}</div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

