
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GanttItrbTooltipProps {
  hoveredItrb: any;
  tooltipPosition: { x: number; y: number };
}

const GanttItrbTooltip: React.FC<GanttItrbTooltipProps> = ({
  hoveredItrb,
  tooltipPosition
}) => {
  if (!hoveredItrb) return null;
  
  // Función para formatear fechas de manera segura
  const formatFechaSafe = (fechaStr: string | Date, defaultDate?: Date): string => {
    try {
      const fecha = fechaStr instanceof Date ? fechaStr : new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return format(defaultDate || new Date(), "dd/MM/yyyy", { locale: es });
      }
      return format(fecha, "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return format(defaultDate || new Date(), "dd/MM/yyyy", { locale: es });
    }
  };
  
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md p-3 text-sm min-w-[250px] max-w-[350px]"
      style={{
        top: `${tooltipPosition.y + 10}px`,
        left: `${tooltipPosition.x + 10}px`,
      }}
    >
      <h3 className="font-bold text-base mb-1 border-b pb-1">{hoveredItrb.descripcion || "ITR"}</h3>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
        <div className="text-gray-500 dark:text-gray-400">Actividad:</div>
        <div className="font-medium">{hoveredItrb.actividad}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Proyecto:</div>
        <div className="font-medium">{hoveredItrb.proyecto}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Sistema:</div>
        <div className="font-medium">{hoveredItrb.sistema}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Subsistema:</div>
        <div className="font-medium">{hoveredItrb.subsistema}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Fecha inicio:</div>
        <div className="font-medium">
          {formatFechaSafe(hoveredItrb.fechaInicio)}
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">Fecha límite:</div>
        <div className="font-medium">
          {formatFechaSafe(hoveredItrb.fechaLimite)}
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">Estado:</div>
        <div className="font-medium flex items-center">
          <span 
            className={`inline-block w-2 h-2 rounded-full mr-1 ${
              hoveredItrb.estado === "Completado" ? "bg-green-500" : 
              hoveredItrb.estado === "En curso" ? "bg-amber-500" : 
              hoveredItrb.estado === "Vencido" ? "bg-red-500" : "bg-gray-500"
            }`}
          />
          {hoveredItrb.estado}
        </div>
        
        {(hoveredItrb.cantidadRealizada !== undefined && hoveredItrb.cantidadTotal !== undefined) && (
          <>
            <div className="text-gray-500 dark:text-gray-400">Progreso:</div>
            <div className="font-medium">
              {hoveredItrb.cantidadRealizada}/{hoveredItrb.cantidadTotal} 
              {hoveredItrb.cantidadTotal > 0 ? ` (${Math.round(hoveredItrb.cantidadRealizada * 100 / hoveredItrb.cantidadTotal)}%)` : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GanttItrbTooltip;
