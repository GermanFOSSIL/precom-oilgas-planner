
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChartTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function ChartContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="h-[300px] w-full overflow-hidden"
      {...props}
    >
      {children}
    </div>
  );
}

export function ChartTooltip({ content, children }: ChartTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <ChartTooltipContent>{content}</ChartTooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ChartTooltipContent({
  children,
}: React.PropsWithChildren) {
  return (
    <TooltipContent side="top" sideOffset={5}>
      {children}
    </TooltipContent>
  );
}
