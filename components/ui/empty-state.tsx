import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  className?: string;
  icon?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ message, className, icon, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          {icon && <div className="mb-4 text-dashboard-card-accent">{icon}</div>}
          <p className="text-base text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
);
EmptyState.displayName = "EmptyState";

