
import React from "react";
import { getRowBackgroundColor, getStatusColor } from "./utils/colorUtils";

interface GanttData {
  id: string;
  nombre: string;
  sistema: string;
  subsistema: string;
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  progreso: number;
  tieneVencidos: boolean;
  tieneMCC: boolean;
  proyecto: string;
  color: string;
  itrbsAsociados: any[];
}

interface GanttActivityBarProps {
  item: GanttData;
  axisDates: Date[];
  isDarkMode: boolean;
  itemIndex: number;
  calculatePosition: (date: Date) => number;
  handleMouseOver: (event: React.MouseEvent, item: GanttData) => void;
  handleItrbMouseOver: (event: React.MouseEvent, itrb: any) => void;
  handleMouseOut: () => void;
  isDateInRange: (date: Date) => boolean;
  withSubsystem?: boolean;
}

const GanttActivityBar: React.FC<GanttActivityBarProps> = ({
  item,
  axisDates,
  isDarkMode,
  itemIndex,
  calculatePosition,
  handleMouseOver,
  handleItrbMouseOver,
  handleMouseOut,
  isDateInRange,
  withSubsystem = true
}) => {
  return (
    <div 
      key={`activity-${item.id}`}
      className="grid border-b relative"
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: getRowBackgroundColor(itemIndex, isDarkMode)
      }}
    >
      <div className={`p-2 ${withSubsystem ? 'pl-8' : 'pl-6'} border-r border-gray-200 dark:border-gray-700 flex items-center`}>
        <span className="text-sm truncate">{item.nombre}</span>
        <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
          {item.itrbsAsociados.length} ITR
        </span>
      </div>
      
      <div className="col-span-full h-full relative">
        {/* Main activity bar */}
        <div 
          className="absolute h-5 top-1/2 -mt-2.5 rounded"
          style={{ 
            left: `${calculatePosition(item.fechaInicio)}%`,
            width: `${calculatePosition(item.fechaFin) - calculatePosition(item.fechaInicio)}%`,
            backgroundColor: "#64748b",
            opacity: 0.7
          }}
        />
        
        {/* Progress bar */}
        <div 
          className="absolute h-5 top-1/2 -mt-2.5 rounded"
          style={{ 
            left: `${calculatePosition(item.fechaInicio)}%`,
            width: `${(calculatePosition(item.fechaFin) - calculatePosition(item.fechaInicio)) * item.progreso / 100}%`,
            backgroundColor: item.tieneVencidos ? "#ef4444" : item.progreso === 100 ? "#22c55e" : "#f59e0b",
            zIndex: 1
          }}
          onMouseOver={(e) => handleMouseOver(e, item)}
          onMouseOut={handleMouseOut}
        >
          <div className="h-full flex items-center px-2 truncate text-xs text-white">
            {item.progreso}%
          </div>
        </div>

        {/* Individual ITR items as bars */}
        {item.itrbsAsociados.map((itrb, itrbIndex) => {
          const itrbStatus = itrb.estado || "En curso";
          
          // Calculate dates for the ITR bar
          const itrbStartDate = itrb.fechaInicio ? new Date(itrb.fechaInicio) : new Date(item.fechaInicio);
          const itrbEndDate = itrb.fechaVencimiento ? new Date(itrb.fechaVencimiento) : 
                            itrb.fechaLimite ? new Date(itrb.fechaLimite) : new Date(item.fechaFin);
          
          // Skip if outside visible range
          if (!isDateInRange(itrbStartDate) && !isDateInRange(itrbEndDate)) return null;
          
          // Calculate the bar's position
          const barStart = Math.max(calculatePosition(itrbStartDate), 0);
          const barEnd = Math.min(calculatePosition(itrbEndDate), 100);
          const barWidth = barEnd - barStart;
          
          // Progress calculation for the ITR
          const itrbProgress = itrb.cantidadRealizada !== undefined && itrb.cantidadTotal !== undefined
            ? Math.round((itrb.cantidadRealizada / itrb.cantidadTotal) * 100)
            : itrbStatus === "Completado" ? 100 : 0;
          
          return (
            <div 
              key={`itrb-${itrb.id}`}
              className="absolute h-3 rounded-sm z-10 hover:h-4 hover:shadow-lg transition-all flex items-center"
              style={{ 
                left: `${barStart}%`,
                width: `${barWidth}%`,
                top: `calc(50% + 7px)`,
                backgroundColor: getStatusColor(itrbStatus),
                border: "1px solid rgba(255,255,255,0.5)"
              }}
              onMouseOver={(e) => handleItrbMouseOver(e, {
                ...itrb,
                actividad: item.nombre,
                sistema: item.sistema,
                subsistema: item.subsistema,
                proyecto: item.proyecto,
                fechaInicio: itrbStartDate,
                fechaFin: itrbEndDate,
                progreso: itrbProgress
              })}
              onMouseOut={handleMouseOut}
            >
              {barWidth > 5 && (
                <div className="mx-1 text-white text-[10px] truncate">
                  {itrb.descripcion || `ITR ${itrbIndex + 1}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttActivityBar;
