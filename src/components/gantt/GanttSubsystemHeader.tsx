
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
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        background: isDarkMode 
          ? "linear-gradient(90deg, rgba(129, 140, 248, 0.3) 0%, rgba(129, 140, 248, 0.05) 100%)"
          : "linear-gradient(90deg, rgba(165, 180, 252, 0.25) 0%, rgba(165, 180, 252, 0.05) 100%)",
        borderLeft: isDarkMode
          ? "3px solid #818CF8"
          : "3px solid #A5B4FC"
      }}
    >
      <div className="p-2 pl-6 font-medium text-sm gantt-label">
        {subsistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSubsystemHeader;
