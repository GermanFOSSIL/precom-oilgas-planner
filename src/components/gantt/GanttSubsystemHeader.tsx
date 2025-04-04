
import React from "react";

interface GanttSubsystemHeaderProps {
  subsistema: string;
  axisDates: Date[];
  isDarkMode: boolean;
}

const GanttSubsystemHeader: React.FC<GanttSubsystemHeaderProps> = ({
  subsistema,
  axisDates,
  isDarkMode
}) => {
  return (
    <div 
      className="grid border-b mb-1 gantt-subsistema-header"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`
      }}
    >
      <div className="p-1 font-medium text-sm gantt-label">
        {subsistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSubsystemHeader;
