import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
}

export const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border-2 border-dashboard-card-border/60 bg-dashboard-card-bg p-5 shadow-sm transition-all hover:border-dashboard-card-border hover:shadow-md",
          className
        )}
        {...props}
      >
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="text-text">{children}</div>
      </div>
    );
  }
);
DashboardCard.displayName = "DashboardCard";

