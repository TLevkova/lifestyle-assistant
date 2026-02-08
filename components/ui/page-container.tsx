import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, spacing = "md", children, ...props }, ref) => {
    const spacingClasses = {
      sm: "space-y-3",
      md: "space-y-4",
      lg: "space-y-6",
    };

    return (
      <div
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageContainer.displayName = "PageContainer";


