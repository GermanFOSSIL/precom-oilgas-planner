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
  const startPosition = Math.max(calculatePosition(item.fechaInicio), 0);
  const endPosition = Math.min(calculatePosition(item.fechaFin), 100);
  const barWidth = Math.max(endPosition - startPosition, 0.5);
  const itrbCount = item.itrbsAsociados?.length || 0;

  const getBarHeight = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "h-4";
      case "mediano": return "h-5";
      case "grande": return "h-6";
      case "completo": return "h-7";
      default: return "h-5";
    }
  };

  const getBarGap = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "gap-y-1";
      case "mediano": return "gap-y-1.5";
      case "grande": return "gap-y-2";
      case "completo": return "gap-y-2.5";
      default: return "gap-y-1.5";
    }
  };

  return (
    <div
      className={`grid border-b relative mb-1 py-1`}
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

      <div className={`col-span-full relative flex flex-col ${getBarGap()}`}>
        {/* Main activity bar */}
        <div
          className={`relative rounded ${getBarHeight()}`}
          style={{
            left: `${startPosition}%`,
            width: `${barWidth}%`,
            backgroundColor: "#94a3b8",
            opacity: 0.9,
            position: "absolute"
          }}
          onMouseOver={(e) => handleMouseOver(e, item)}
          onMouseOut={handleMouseOut}
        >
          <div
            className="h-full rounded"
            style={{
              width: `${item.progreso}%`,
              backgroundColor: item.tieneVencidos ? "#ef4444" : item.progreso === 100 ? "#22c55e" : "#f59e0b",
            }}
          >
            {barWidth > 10 && (
              <div className="h-full flex items-center px-2 truncate text-xs text-white">
                {item.progreso}%
              </div>
            )}
          </div>
        </div>

        {/* ITRs stacked */}
        {item.itrbsAsociados.map((itrb, index) => {
          const status = itrb.estado || "En curso";
          const start = Math.max(calculatePosition(new Date(itrb.fechaInicio || item.fechaInicio)), 0);
          const end = Math.min(calculatePosition(new Date(itrb.fechaVencimiento || itrb.fechaLimite || item.fechaFin)), 100);
          const width = Math.max(end - start, 0.5);
          const progreso = itrb.cantidadRealizada && itrb.cantidadTotal
            ? Math.round((itrb.cantidadRealizada / itrb.cantidadTotal) * 100)
            : status === "Completado" ? 100 : 0;

          if (!isDateInRange(new Date(itrb.fechaInicio)) && !isDateInRange(new Date(itrb.fechaVencimiento || itrb.fechaLimite))) return null;

          return (
            <div
              key={`itrb-${itrb.id}`}
              className={`relative rounded-sm z-10 hover:shadow-lg ${getBarHeight()}`}
              style={{
                left: `${start}%`,
                width: `${width}%`,
                backgroundColor: getStatusColor(status),
                position: "absolute",
                top: `${(index + 1) * 22}px`
              }}
              onMouseOver={(e) => handleItrbMouseOver(e, {
                ...itrb,
                actividad: item.nombre,
                sistema: item.sistema,
                subsistema: item.subsistema,
                proyecto: item.proyecto,
                fechaInicio: new Date(itrb.fechaInicio),
                fechaFin: new Date(itrb.fechaVencimiento || itrb.fechaLimite),
                progreso
              })}
              onMouseOut={handleMouseOut}
            >
              {width > 5 && (
                <div className="mx-1 text-white text-[10px] truncate">
                  {itrb.descripcion || `ITR ${index + 1}`}
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
