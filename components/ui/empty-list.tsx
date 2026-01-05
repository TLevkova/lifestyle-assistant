import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyListProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyList = React.forwardRef<HTMLDivElement, EmptyListProps>(
  ({ message, actionLabel, onAction, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardContent className="py-10 text-center">
          <p className="text-base text-muted-foreground">{message}</p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-4 text-sm font-medium text-dashboard-card-accent hover:underline transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </CardContent>
      </Card>
    );
  }
);
EmptyList.displayName = "EmptyList";

