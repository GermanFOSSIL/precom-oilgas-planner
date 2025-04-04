
import React from "react";

interface GanttSystemHeaderProps {
  sistema: string;
  axisDates: Date[];
  isDarkMode: boolean;
}

const GanttSystemHeader: React.FC<GanttSystemHeaderProps> = ({
  sistema,
  axisDates,
  isDarkMode
}) => {
  return (
    <div 
      className="grid border-b mb-1 gantt-sistema-header"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        background: isDarkMode 
          ? "linear-gradient(90deg, rgba(79, 70, 229, 0.35) 0%, rgba(79, 70, 229, 0.1) 100%)"
          : "linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(79, 70, 229, 0.05) 100%)",
        borderLeft: isDarkMode
          ? "4px solid #6366F1"
          : "4px solid #4F46E5"
      }}
    >
      <div className="p-2 pl-4 font-medium gantt-label text-lg">
        {sistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSystemHeader;
