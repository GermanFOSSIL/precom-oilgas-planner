
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
      className="grid sticky top-0 z-20 border-b shadow-sm"
      style={{ 
        gridTemplateColumns,
        backgroundColor: isDarkMode ? "#1e293b" : "#ffffff"
      }}
    >
      <div className="p-2 border-r border-gray-200 dark:border-gray-700 font-medium">
        {viewMode === "month" ? "Mes" : viewMode === "week" ? "Semana" : "Día"}
      </div>
      
      {axisDates.map((date, index) => (
        <div 
          key={index} 
          className={`
            text-center text-xs py-2 border-r border-gray-200 dark:border-gray-700
            ${isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''}
          `}
        >
          {viewMode === "month" 
            ? format(date, "d", { locale: es })
            : viewMode === "week"
              ? format(date, "EEE d", { locale: es })
              : format(date, "HH:mm")
          }
        </div>
      ))}
    </div>
  );
};

export default GanttDateHeaders;
