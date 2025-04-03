
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GanttTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  mostrarSubsistemas: boolean;
}

const GanttTooltip: React.FC<GanttTooltipProps> = ({
  active,
  payload,
  label,
  mostrarSubsistemas,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const fechaInicio = format(data.fechaInicio, "dd MMM yyyy", { locale: es });
  const fechaFin = format(data.fechaFin, "dd MMM yyyy", { locale: es });
  const duracion = `${data.duracion} días`;
  const progreso = `${data.progreso}%`;
  const estado = data.progreso === 100 
    ? "Completado" 
    : data.tieneVencidos 
      ? "Vencido" 
      : data.progreso > 0 
        ? "En curso" 
        : "No iniciado";
  
  const getBadgeColor = () => {
    if (data.tieneVencidos) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (data.progreso === 100) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (data.progreso > 0) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 max-w-xs">
      <div className="font-medium text-slate-900 dark:text-white mb-1">{data.nombre}</div>
      
      {mostrarSubsistemas && (
        <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">
          <span className="font-medium">Sistema:</span> {data.sistema} / {data.subsistema}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        <div className="text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">Inicio:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">{fechaInicio}</span>
        </div>
        <div className="text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">Fin:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">{fechaFin}</span>
        </div>
        <div className="text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">Duración:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">{duracion}</span>
        </div>
        <div className="text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">Avance:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">{progreso}</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
        <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}>
          {estado}
        </span>
        
        {data.tieneMCC && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-1">
            MCC
          </span>
        )}
        
        {data.itrbsAsociados && data.itrbsAsociados.length > 0 && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {data.itrbsAsociados.length} ITRBs asociados
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttTooltip;
