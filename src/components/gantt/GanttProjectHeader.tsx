
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
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`
      }}
    >
      <div className="p-2 font-bold gantt-label">
        {proyecto}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttProjectHeader;
