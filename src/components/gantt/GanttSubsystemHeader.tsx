
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
      className="grid border-b mb-1"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: "#7d8ae8" // Light blue for subsystems
      }}
    >
      <div className="p-1 pl-6 font-medium text-sm text-white">
        {subsistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSubsystemHeader;
