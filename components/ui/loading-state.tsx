import * as React from "react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  variant?: "card" | "dashboard";
  className?: string;
}

export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message = "Loading...", variant = "card", className, ...props }, ref) => {
    if (variant === "dashboard") {
      return (
        <DashboardCard title="Loading" ref={ref} className={className} {...props}>
          <p className="text-base text-muted-foreground">{message}</p>
        </DashboardCard>
      );
    }

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardContent className="py-10 text-center">
          <p className="text-base text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
);
LoadingState.displayName = "LoadingState";

