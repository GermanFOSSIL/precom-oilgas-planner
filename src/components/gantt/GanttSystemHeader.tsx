
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
      className={`
        grid border-b
        ${isDarkMode ? 'bg-indigo-800 text-white' : 'bg-indigo-500 text-white'}
      `}
      style={{ gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)` }}
    >
      <div className="p-2 pl-4 font-semibold">
        {sistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSystemHeader;
