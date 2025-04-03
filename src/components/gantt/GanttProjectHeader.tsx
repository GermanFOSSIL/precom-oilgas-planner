
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
      className="grid border-b"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: "#4b32c3" // Violeta sólido para proyectos
      }}
    >
      <div className="p-2 font-bold text-white">
        {proyecto}
      </div>
      <div className="col-span-full"></div>
    </div>
  );
};

export default GanttProjectHeader;
