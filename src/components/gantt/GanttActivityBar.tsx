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
  const rowHeight = 28 + itrbCount * 20;

  const getBarHeight = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "h-5 top-1";
      case "mediano": return "h-6 top-1";
      case "grande": return "h-7 top-1";
      case "completo": return "h-8 top-1";
      default: return "h-6 top-1";
    }
  };

  return (
    <div
      key={`activity-${item.id}`}
      className={`grid border-b relative mb-1`}
      style={{
        gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
        backgroundColor: getRowBackgroundColor(itemIndex, isDarkMode),
        height: `${rowHeight}px`
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
        <div
          className={`absolute rounded ${getBarHeight()}`}
          style={{
            left: `${startPosition}%`,
            width: `${barWidth}%`,
            backgroundColor: "#94a3b8",
            opacity: 0.9,
            top: "8px"
          }}
          onMouseOver={(e) => handleMouseOver(e, item)}
          onMouseOut={handleMouseOut}
        >
          <div
            className="h-full rounded"
            style={{
              width: `${item.progreso}%`,
              backgroundColor: item.tieneVencidos ? "#ef4444" : item.progreso === 100 ? "#22c55e" : "#f59e0b"
            }}
          >
            {barWidth > 10 && (
              <div className="h-full flex items-center px-2 truncate text-xs text-white">
                {item.progreso}%
              </div>
            )}
          </div>
        </div>

        {item.itrbsAsociados.map((itrb, itrbIndex) => {
          const itrbStatus = itrb.estado || "En curso";
          const itrbStart = itrb.fechaInicio ? new Date(itrb.fechaInicio) : new Date(item.fechaInicio);
          const itrbEnd = itrb.fechaVencimiento ? new Date(itrb.fechaVencimiento) : new Date(item.fechaFin);

          if (!isDateInRange(itrbStart) && !isDateInRange(itrbEnd)) return null;

          const barStart = Math.max(calculatePosition(itrbStart), 0);
          const barEnd = Math.min(calculatePosition(itrbEnd), 100);
          const itrbBarWidth = Math.max(barEnd - barStart, 0.5);

          const itrbProgress = itrb.cantidadRealizada && itrb.cantidadTotal
            ? Math.round((itrb.cantidadRealizada / itrb.cantidadTotal) * 100)
            : itrbStatus === "Completado" ? 100 : 0;

          return (
            <div
              key={`itrb-${itrb.id}`}
              className="absolute h-3 rounded-sm z-10 hover:h-4 hover:shadow-lg transition-all"
              style={{
                left: `${barStart}%`,
                width: `${itrbBarWidth}%`,
                top: `${32 + itrbIndex * 18}px`,
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

