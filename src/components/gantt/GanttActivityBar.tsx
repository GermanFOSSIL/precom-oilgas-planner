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
  tamanoGrafico?: "pequeno" | "mediano" | "grande" | "completo";
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
  withSubsystem = true,
  tamanoGrafico = "mediano"
}) => {
  // Ensure positions are calculated correctly
  const startPosition = Math.max(calculatePosition(item.fechaInicio), 0);
  const endPosition = Math.min(calculatePosition(item.fechaFin), 100);
  const barWidth = Math.max(endPosition - startPosition, 0.5); // Ensure minimum width for visibility

  // Count of ITRs for badge
  const itrbCount = item.itrbsAsociados?.length || 0;

  // Get row and bar height based on size setting
  const getRowHeight = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "h-8";
      case "mediano": return "h-10";
      case "grande": return "h-12";
      case "completo": return "h-14";
      default: return "h-10";
    }
  };

  // Get bar height based on size setting
  const getBarHeight = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "h-5 top-1/2 -mt-2.5";
      case "mediano": return "h-6 top-1/2 -mt-3";
      case "grande": return "h-7 top-1/2 -mt-3.5";
      case "completo": return "h-9 top-1/2 -mt-4";
      default: return "h-6 top-1/2 -mt-3";
    }
  };

  // Get ITR bar vertical spacing
  const getItrbVerticalSpacing = (index: number) => {
    const baseSpacing = tamanoGrafico === "pequeno" ? 6 : 
                        tamanoGrafico === "grande" ? 10 : 8;
    return baseSpacing + (index * 4);
  };

  return (
    <div 
      key={`activity-${item.id}`}
      className={`grid border-b relative ${getRowHeight()} mb-1`}
      style={{ 
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: getRowBackgroundColor(itemIndex, isDarkMode)
      }}
    >
      <div className={`px-2 ${withSubsystem ? 'pl-8' : 'pl-6'} border-r border-gray-200 dark:border-gray-700 flex items-center gap-2`}>
        <span className="text-sm truncate">{item.nombre}</span>
        {itrbCount > 0 && (
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
            {itrbCount} ITR
          </span>
        )}
      </div>
      
      <div className="col-span-full h-full relative">
        {/* Main activity bar */}
        <div 
          className={`absolute rounded ${getBarHeight()}`}
          style={{ 
            left: `${startPosition}%`,
            width: `${barWidth}%`,
            backgroundColor: "#94a3b8", // Base color for the activity bar
            opacity: 0.9
          }}
          onMouseOver={(e) => handleMouseOver(e, item)}
          onMouseOut={handleMouseOut}
        >
          {/* Progress bar (colored portion) */}
          <div 
            className="h-full rounded"
            style={{ 
              width: `${item.progreso}%`,
              backgroundColor: item.tieneVencidos ? "#ef4444" : 
                              item.progreso === 100 ? "#22c55e" : "#f59e0b",
            }}
          >
            {barWidth > 10 && (
              <div className="h-full flex items-center px-2 truncate text-xs text-white">
                {item.progreso}%
              </div>
            )}
          </div>
        </div>

        {/* Individual ITR items as bars - ensure they're spaced properly */}
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
          const itrbBarWidth = Math.max(barEnd - barStart, 0.5); // Ensure minimum width
          
          // Progress calculation for the ITR
          const itrbProgress = itrb.cantidadRealizada !== undefined && itrb.cantidadTotal !== undefined
            ? Math.round((itrb.cantidadRealizada / itrb.cantidadTotal) * 100)
            : itrbStatus === "Completado" ? 100 : 0;
          
          // Determine the y-position based on index and size setting
          const yOffset = getItrbVerticalSpacing(itrbIndex);
          
          return (
            <div 
              key={`itrb-${itrb.id}`}
              className="absolute h-3 rounded-sm z-10 hover:h-4 hover:shadow-lg transition-all"
              style={{ 
                left: `${barStart}%`,
                width: `${itrbBarWidth}%`,
                top: `calc(50% + ${yOffset}px)`,
                backgroundColor: getStatusColor(itrbStatus),
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
              {itrbBarWidth > 5 && (
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
