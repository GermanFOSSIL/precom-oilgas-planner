
import React from "react";
import { isWithinInterval } from "date-fns";

interface GanttTodayIndicatorProps {
  currentStartDate: Date;
  currentEndDate: Date;
  calculatePosition: (date: Date) => number;
}

const GanttTodayIndicator: React.FC<GanttTodayIndicatorProps> = ({
  currentStartDate,
  currentEndDate,
  calculatePosition
}) => {
  const today = new Date();
  const isDateInRange = isWithinInterval(today, { start: currentStartDate, end: currentEndDate });
  
  if (!isDateInRange) return null;
  
  return (
    <div 
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
      style={{ 
        left: `calc(280px + ${calculatePosition(today)}% * (100% - 280px) / 100)`,
      }}
    >
      <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
        Hoy
      </div>
    </div>
  );
};

export default GanttTodayIndicator;
