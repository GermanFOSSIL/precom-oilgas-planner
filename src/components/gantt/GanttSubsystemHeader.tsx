
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
      className="grid border-b"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: "#a5b4fc" // Light indigo/purple color from image
      }}
    >
      <div className="p-1 pl-6 font-medium text-sm text-gray-800">
        {subsistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSubsystemHeader;
