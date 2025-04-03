import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GanttTooltipProps {
  item: {
    nombre: string;
    sistema: string;
    subsistema: string;
    fechaInicio: Date;
    fechaFin: Date;
    progreso: number;
    tieneVencidos: boolean;
    proyecto: string;
    itrbsAsociados: any[];
  };
  position: {
    x: number;
    y: number;
  };
}

const GanttTooltip: React.FC<GanttTooltipProps> = ({ item, position }) => {
  // Calculate the tooltip position (adjust to keep it in viewport)
  const tooltipStyle = {
    top: `${position.y + 10}px`,
    left: `${position.x + 10}px`,
  };
  
  // Calculate estado based on progress and vencidos
  const getEstado = () => {
    if (item.tieneVencidos) return "Vencido";
    if (item.progreso === 100) return "Completado";
    if (item.progreso > 0) return "En curso";
    return "Pendiente";
  };
  
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md p-3 text-sm min-w-[250px] max-w-[350px]"
      style={tooltipStyle}
    >
      <h3 className="font-bold text-base mb-1 border-b pb-1">{item.nombre}</h3>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
        <div className="text-gray-500 dark:text-gray-400">Proyecto:</div>
        <div className="font-medium">{item.proyecto}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Sistema:</div>
        <div className="font-medium">{item.sistema}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Subsistema:</div>
        <div className="font-medium">{item.subsistema}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Fecha inicio:</div>
        <div className="font-medium">
          {format(item.fechaInicio, "dd/MM/yyyy", { locale: es })}
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">Fecha fin:</div>
        <div className="font-medium">
          {format(item.fechaFin, "dd/MM/yyyy", { locale: es })}
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">Progreso:</div>
        <div className="font-medium">{item.progreso}%</div>
        
        <div className="text-gray-500 dark:text-gray-400">Estado:</div>
        <div className="font-medium">
          <span 
            className={`inline-block w-2 h-2 rounded-full mr-1 ${
              getEstado() === "Completado" ? "bg-green-500" : 
              getEstado() === "En curso" ? "bg-amber-500" : 
              getEstado() === "Vencido" ? "bg-red-500" : "bg-gray-500"
            }`}
          />
          {getEstado()}
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">ITRs:</div>
        <div className="font-medium">{item.itrbsAsociados.length}</div>
      </div>
      
      {item.itrbsAsociados.length > 0 && (
        <div className="mt-2 border-t pt-1">
          <h4 className="font-semibold text-xs">ITRs asociados:</h4>
          <ul className="mt-1 text-xs max-h-[100px] overflow-y-auto">
            {item.itrbsAsociados.slice(0, 5).map((itrb, index) => (
              <li key={index} className="mb-1 flex items-center">
                <span 
                  className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    itrb.estado === "Completado" ? "bg-green-500" : 
                    itrb.estado === "En curso" ? "bg-amber-500" : 
                    itrb.estado === "Vencido" ? "bg-red-500" : "bg-gray-500"
                  }`}
                />
                <span className="truncate">{itrb.descripcion}</span>
              </li>
            ))}
            {item.itrbsAsociados.length > 5 && (
              <li className="text-gray-500 italic">
                Y {item.itrbsAsociados.length - 5} más...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GanttTooltip;
