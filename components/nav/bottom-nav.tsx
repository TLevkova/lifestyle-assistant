"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, UtensilsCrossed, Pill, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/workouts", icon: Activity, label: "Workouts" },
  { href: "/food", icon: UtensilsCrossed, label: "Food" },
  { href: "/supplements", icon: Pill, label: "Supplements" },
  { href: "/log", icon: BookOpen, label: "Log" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-sm">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href);
            
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="lg"
                  className={cn(
                    "w-full flex-col gap-1 h-auto py-3 px-2 min-h-[64px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

