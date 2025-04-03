
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
      className={`
        grid border-b
        ${isDarkMode ? 'bg-indigo-700/50 text-white' : 'bg-indigo-300 text-gray-800'}
      `}
      style={{ gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)` }}
    >
      <div className="p-1 pl-6 font-medium text-sm">
        {subsistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSubsystemHeader;
