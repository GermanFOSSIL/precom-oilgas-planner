
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
      className="grid border-b mb-1"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: "#4e5ed4" // Medium blue for systems
      }}
    >
      <div className="p-2 pl-4 font-semibold text-white">
        {sistema}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttSystemHeader;
