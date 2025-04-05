
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
  const itrbCount = item.itrbsAsociados?.length || 0;

  const startPosition = Math.max(calculatePosition(item.fechaInicio), 0);
  const endPosition = Math.min(calculatePosition(item.fechaFin), 100);
  const barWidth = Math.max(endPosition - startPosition, 0.5);

  // Altura base + altura por ITR
  const rowHeight = tamanoGrafico === "pequeno" ? 24 + itrbCount * 18 : 
                   tamanoGrafico === "mediano" ? 28 + itrbCount * 20 : 
                   tamanoGrafico === "grande" ? 32 + itrbCount * 22 : 36 + itrbCount * 24;

  const getBarHeight = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "h-5";
      case "mediano": return "h-6";
      case "grande": return "h-7";
      case "completo": return "h-8";
      default: return "h-6";
    }
  };

  return (
    <div
      key={`activity-${item.id}`}
      className="gantt-actividad-row"
      style={{
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        height: `${rowHeight}px`
      }}
    >
      <div className={`gantt-actividad-label ${withSubsystem ? '' : 'pl-6'}`}>
        <span className="text-sm truncate flex items-center justify-between w-full">
          {item.nombre}
          {itrbCount > 0 && (
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
              {itrbCount} ITR
            </span>
          )}
        </span>
      </div>

      <div className="col-span-full h-full relative">
        <div
          className={`gantt-bar gantt-actividad-bar ${getBarHeight()}`}
          style={{
            left: `${startPosition}%`,
            width: `${barWidth}%`,
            top: "8px"
          }}
          onMouseOver={(e) => handleMouseOver(e, item)}
          onMouseOut={handleMouseOut}
        >
          <div
            className="gantt-progress-bar"
            style={{
              width: `${item.progreso}%`
            }}
          >
          </div>

          {barWidth > 10 && (
            <div className="gantt-bar-label">
              {item.progreso}%
            </div>
          )}
        </div>

        {item.itrbsAsociados.map((itrb, itrbIndex) => {
          const itrbStatus = itrb.estado || "En curso";
          // Usar fecha de la actividad como fallback si no existe fechaInicio en ITRB
          const itrbStart = new Date(item.fechaInicio);
          const itrbEnd = itrb.fechaLimite ? new Date(itrb.fechaLimite) : new Date(item.fechaFin);

          if (!isDateInRange(itrbStart) && !isDateInRange(itrbEnd)) return null;

          const barStart = Math.max(calculatePosition(itrbStart), 0);
          const barEnd = Math.min(calculatePosition(itrbEnd), 100);
          const itrbBarWidth = Math.max(barEnd - barStart, 0.5);

          const itrbProgress = itrb.cantidadRealizada && itrb.cantidadTotal
            ? Math.round((itrb.cantidadRealizada / itrb.cantidadTotal) * 100)
            : itrbStatus === "Completado" ? 100 : 0;

          const getItrbTopPosition = (idx: number) => {
            switch (tamanoGrafico) {
              case "pequeno": return 30 + idx * 16;
              case "mediano": return 32 + idx * 18;
              case "grande": return 34 + idx * 20;
              case "completo": return 36 + idx * 22;
              default: return 32 + idx * 18;
            }
          };

          // Format ITR label to show both description and code
          const itrbDescription = itrb.descripcion || "FOSSIL";
          const itrbCode = itrb.codigo || "";
          const itrbLabel = `${itrbDescription}${itrbCode ? ` - ${itrbCode}` : ""} (${itrb.cantidadRealizada || 0}/${itrb.cantidadTotal || 0})`;

          return (
            <div
              key={`itrb-${itrb.id}`}
              className="gantt-bar gantt-itrb-bar"
              style={{
                left: `${barStart}%`,
                width: `${itrbBarWidth}%`,
                top: `${getItrbTopPosition(itrbIndex)}px`,
                backgroundColor: getStatusColor(itrbStatus)
              }}
              onMouseOver={(e) => handleItrbMouseOver(e, {
                ...itrb,
                actividad: item.nombre,
                sistema: item.sistema,
                subsistema: item.subsistema,
                proyecto: item.proyecto,
                fechaInicio: itrbStart,
                fechaFin: itrbEnd,
                progreso: itrbProgress
              })}
              onMouseOut={handleMouseOut}
            >
              {/* Barra de progreso interna */}
              <div 
                className="gantt-progress-bar"
                style={{ 
                  width: `${itrbProgress}%`,
                  backgroundColor: itrbStatus === "Completado" ? "#15803d" : 
                                  itrbStatus === "En curso" ? "#d97706" : 
                                  itrbStatus === "Vencido" ? "#b91c1c" : "#64748b"  
                }}
              >
              </div>
              
              {itrbBarWidth > 5 && (
                <div className="gantt-bar-label">
                  {itrbLabel}
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
