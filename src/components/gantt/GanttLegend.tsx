
import React from "react";

interface GanttLegendProps {
  mostrarLeyenda: boolean;
}

const GanttLegend: React.FC<GanttLegendProps> = ({ mostrarLeyenda }) => {
  if (!mostrarLeyenda) return null;
  
  return (
    <div className="flex flex-wrap justify-center mt-4 space-x-4 space-y-2 pb-4">
      <div className="flex items-center ml-4 mt-2">
        <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: "#22c55e" }}></div>
        <span className="text-sm">Completado</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: "#f59e0b" }}></div>
        <span className="text-sm">En curso</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: "#ef4444" }}></div>
        <span className="text-sm">Vencido</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: "#64748b" }}></div>
        <span className="text-sm">Actividad</span>
      </div>
    </div>
  );
};

export default GanttLegend;
