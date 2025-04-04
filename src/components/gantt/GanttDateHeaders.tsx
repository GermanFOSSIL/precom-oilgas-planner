
import React from "react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";

interface GanttDateHeadersProps {
  axisDates: Date[];
  viewMode: "month" | "week" | "day";
  isDarkMode: boolean;
}

const GanttDateHeaders: React.FC<GanttDateHeadersProps> = ({
  axisDates,
  viewMode,
  isDarkMode
}) => {
  const gridTemplateColumns = `minmax(200px, auto) ${axisDates.map(() => "1fr").join(" ")}`;

  return (
    <div 
      className="grid sticky top-0 z-20 border-b gantt-timeline-header"
      style={{ 
        gridTemplateColumns
      }}
    >
      <div className="p-2 border-r border-gray-200 dark:border-gray-700 font-medium">
        {viewMode === "month" ? "Mes" : viewMode === "week" ? "Semana" : "Día"}
      </div>
      
      {axisDates.map((date, index) => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isFirstOfMonth = date.getDate() === 1;
        
        return (
          <div 
            key={index} 
            className={`
              gantt-day-header
              ${isWeekend ? 'gantt-weekend' : ''}
              ${isToday(date) ? 'font-bold text-primary' : ''}
              ${isFirstOfMonth ? 'gantt-month-start' : ''}
            `}
          >
            {viewMode === "month" 
              ? format(date, "d", { locale: es })
              : viewMode === "week"
                ? format(date, "EEE d", { locale: es })
                : format(date, "HH:mm")
            }
          </div>
        );
      })}
    </div>
  );
};

export default GanttDateHeaders;
