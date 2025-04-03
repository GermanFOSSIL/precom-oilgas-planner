
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const GanttLoadingState: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-60" />
      </div>
      <div className="flex-1">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  );
};

export default GanttLoadingState;
