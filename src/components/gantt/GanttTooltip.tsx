
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface GanttTooltipProps {
  item: {
    nombre: string;
    proyecto: string;
    sistema: string;
    subsistema: string;
    fechaInicio: Date;
    fechaFin: Date;
    progreso: number;
    tieneVencidos: boolean;
    tieneMCC?: boolean;
    itrbsAsociados: any[];
  };
  position: {
    x: number;
    y: number;
  };
}

const GanttTooltip: React.FC<GanttTooltipProps> = ({ item, position }) => {
  // Function to get color based on progress and status
  const getProgressColor = (progreso: number, tieneVencidos: boolean) => {
    if (tieneVencidos) return "bg-red-500";
    if (progreso === 100) return "bg-green-500";
    if (progreso > 75) return "bg-emerald-500";
    if (progreso > 50) return "bg-amber-500";
    if (progreso > 25) return "bg-orange-500";
    return "bg-gray-500";
  };

  // Count ITRs by status
  const countByStatus = {
    "Completado": item.itrbsAsociados.filter(i => i.estado === "Completado").length,
    "En curso": item.itrbsAsociados.filter(i => i.estado === "En curso").length,
    "Vencido": item.itrbsAsociados.filter(i => i.estado === "Vencido").length,
    "Total": item.itrbsAsociados.length
  };

  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md p-3 text-sm min-w-[300px] max-w-[380px]"
      style={{
        top: `${position.y + 10}px`,
        left: `${position.x + 10}px`,
      }}
    >
      <h3 className="font-bold text-base mb-2 border-b pb-1">{item.nombre}</h3>
      
      <div className="grid grid-cols-[100px_1fr] gap-y-1 mb-3">
        <div className="text-gray-500 dark:text-gray-400">Proyecto:</div>
        <div className="font-medium">{item.proyecto}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Sistema:</div>
        <div className="font-medium">{item.sistema}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Subsistema:</div>
        <div className="font-medium">{item.subsistema}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Fecha inicio:</div>
        <div className="font-medium">{format(item.fechaInicio, "dd/MM/yyyy", { locale: es })}</div>
        
        <div className="text-gray-500 dark:text-gray-400">Fecha fin:</div>
        <div className="font-medium">{format(item.fechaFin, "dd/MM/yyyy", { locale: es })}</div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-gray-500 dark:text-gray-400">Progreso:</span>
          <span className={`font-medium rounded px-1.5 py-0.5 text-white ${getProgressColor(item.progreso, item.tieneVencidos)}`}>
            {item.progreso}%
          </span>
        </div>
        <Progress 
          value={item.progreso} 
          className="h-2" 
          indicatorClassName={getProgressColor(item.progreso, item.tieneVencidos)} 
        />
      </div>
      
      <div className="text-gray-500 dark:text-gray-400 mb-1">Distribución de ITRs:</div>
      <div className="grid grid-cols-4 gap-2 mt-1">
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          <div className="font-bold text-lg">{countByStatus.Total}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded p-2 text-center">
          <div className="text-xs text-green-600 dark:text-green-400">Completados</div>
          <div className="font-bold text-lg text-green-600 dark:text-green-400">{countByStatus.Completado}</div>
        </div>
        <div className="bg-amber-100 dark:bg-amber-900/30 rounded p-2 text-center">
          <div className="text-xs text-amber-600 dark:text-amber-400">En curso</div>
          <div className="font-bold text-lg text-amber-600 dark:text-amber-400">{countByStatus["En curso"]}</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded p-2 text-center">
          <div className="text-xs text-red-600 dark:text-red-400">Vencidos</div>
          <div className="font-bold text-lg text-red-600 dark:text-red-400">{countByStatus.Vencido}</div>
        </div>
      </div>
      
      {item.tieneMCC !== undefined && (
        <div className="mt-3 flex gap-2 items-center">
          <div className={`inline-block w-3 h-3 rounded-full ${item.tieneMCC ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
          <span className="text-gray-500 dark:text-gray-400">
            {item.tieneMCC ? 'Tiene MCC' : 'Sin MCC'}
          </span>
        </div>
      )}
    </div>
  );
};

export default GanttTooltip;
