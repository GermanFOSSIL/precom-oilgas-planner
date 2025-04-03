
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
      className="grid border-b"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: "#6366f1" // Medium indigo/purple color from image
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
