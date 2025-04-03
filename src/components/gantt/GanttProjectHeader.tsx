
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
      className={`
        grid border-b
        ${isDarkMode ? 'bg-indigo-900 text-white' : 'bg-indigo-700 text-white'}
      `}
      style={{ gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)` }}
    >
      <div className="p-2 font-bold">
        {proyecto}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttProjectHeader;
