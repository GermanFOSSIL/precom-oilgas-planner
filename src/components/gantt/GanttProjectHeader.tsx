
import React from "react";

interface GanttProjectHeaderProps {
  proyecto: string;
  axisDates: Date[];
  isDarkMode: boolean;
}

const GanttProjectHeader: React.FC<GanttProjectHeaderProps> = ({
  proyecto,
  axisDates,
  isDarkMode
}) => {
  return (
    <div 
      className="grid border-b mb-1 gantt-proyecto-header"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        background: isDarkMode 
          ? "linear-gradient(90deg, rgba(49, 46, 129, 0.7) 0%, rgba(49, 46, 129, 0.3) 100%)"
          : "linear-gradient(90deg, rgba(67, 56, 202, 0.3) 0%, rgba(67, 56, 202, 0.1) 100%)",
        borderLeft: isDarkMode
          ? "5px solid #4F46E5"
          : "5px solid #4338CA",
        borderBottom: "2px solid var(--border)"
      }}
    >
      <div className="p-3 font-bold gantt-label text-xl">
        {proyecto}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttProjectHeader;
