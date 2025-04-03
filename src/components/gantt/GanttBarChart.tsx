
import React, { useState, useEffect, useMemo } from "react";
import { format, isToday, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAxisDates, formatXAxis } from "./utils/dateUtils";
import { getRowBackgroundColor, getStatusColor } from "./utils/colorUtils";
import GanttTooltip from "./GanttTooltip";

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

interface GanttBarChartProps {
  data: GanttData[];
  currentStartDate: Date;
  currentEndDate: Date;
  zoomLevel: number;
  viewMode: "month" | "week" | "day";
  mostrarSubsistemas: boolean;
  mostrarLeyenda?: boolean;
}

const GanttBarChart: React.FC<GanttBarChartProps> = ({
  data,
  currentStartDate,
  currentEndDate,
  zoomLevel,
  viewMode,
  mostrarSubsistemas,
  mostrarLeyenda = true
}) => {
  const [hoveredItem, setHoveredItem] = useState<GanttData | null>(null);
  const [hoveredItrb, setHoveredItrb] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Determine if dark mode is active
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
    
    // Set up observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Group data by project, system, subsystem
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, string[]>> = {};
    
    data.forEach(item => {
      if (!result[item.proyecto]) {
        result[item.proyecto] = {};
      }
      
      if (!result[item.proyecto][item.sistema]) {
        result[item.proyecto][item.sistema] = [];
      }
      
      if (!result[item.proyecto][item.sistema].includes(item.subsistema)) {
        result[item.proyecto][item.sistema].push(item.subsistema);
      }
    });
    
    return result;
  }, [data]);

  // Get dates for the timeline based on the current view mode
  const axisDates = useMemo(() => {
    return getAxisDates(currentStartDate, currentEndDate, viewMode);
  }, [currentStartDate, currentEndDate, viewMode]);

  // Function to determine if a date is within displayed range
  const isDateInRange = (date: Date) => {
    return isWithinInterval(date, { start: currentStartDate, end: currentEndDate });
  };

  // Function to calculate position as percentage
  const calculatePosition = (date: Date): number => {
    const totalDuration = currentEndDate.getTime() - currentStartDate.getTime();
    const timeFromStart = date.getTime() - currentStartDate.getTime();
    return (timeFromStart / totalDuration) * 100;
  };

  // Handle mouse over for tooltip
  const handleMouseOver = (event: React.MouseEvent, item: GanttData) => {
    setHoveredItem(item);
    setHoveredItrb(null);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  // Handle mouse over for ITR tooltip
  const handleItrbMouseOver = (event: React.MouseEvent, itrb: any) => {
    setHoveredItrb(itrb);
    setHoveredItem(null);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    event.stopPropagation();
  };

  // Handle mouse out for tooltip
  const handleMouseOut = () => {
    setHoveredItem(null);
    setHoveredItrb(null);
  };

  // Calculate gridTemplateColumns for the date headers
  const gridTemplateColumns = useMemo(() => {
    return axisDates.map(() => "1fr").join(" ");
  }, [axisDates]);

  return (
    <div className="w-full h-full flex flex-col">
      <ScrollArea className="w-full h-full">
        <div className="min-w-[800px] relative">
          {/* Date Headers */}
          <div 
            className="grid sticky top-0 z-20 border-b shadow-sm"
            style={{ 
              gridTemplateColumns: `minmax(200px, auto) ${gridTemplateColumns}`,
              backgroundColor: isDarkMode ? "#1e293b" : "#ffffff"
            }}
          >
            <div className="p-2 border-r border-gray-200 dark:border-gray-700 font-medium">
              {viewMode === "month" ? "Mes" : viewMode === "week" ? "Semana" : "Día"}
            </div>
            
            {axisDates.map((date, index) => (
              <div 
                key={index} 
                className={`
                  text-center text-xs py-2 border-r border-gray-200 dark:border-gray-700
                  ${isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''}
                `}
              >
                {viewMode === "month" 
                  ? format(date, "d", { locale: es })
                  : viewMode === "week"
                    ? format(date, "EEE d", { locale: es })
                    : format(date, "HH:mm")
                }
              </div>
            ))}
          </div>

          {/* Today indicator */}
          {isDateInRange(new Date()) && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ 
                left: `calc(200px + ${calculatePosition(new Date())}% * (100% - 200px) / 100)`,
              }}
            >
              <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                Hoy
              </div>
            </div>
          )}

          {/* Gantt Content */}
          <div className="w-full">
            {Object.entries(groupedData).map(([proyecto, sistemas], proyectoIndex) => (
              <React.Fragment key={`proyecto-${proyectoIndex}`}>
                {/* Project Header */}
                <div 
                  className={`
                    grid border-b
                    ${isDarkMode ? 'bg-indigo-900 text-white' : 'bg-indigo-700 text-white'}
                  `}
                  style={{ gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)` }}
                >
                  <div className="p-2 font-bold">
                    {proyecto}
                  </div>
                  <div className="col-span-full"></div>
                </div>

                {Object.entries(sistemas).map(([sistema, subsistemas], sistemaIndex) => (
                  <React.Fragment key={`sistema-${proyectoIndex}-${sistemaIndex}`}>
                    {/* System Header */}
                    <div 
                      className={`
                        grid border-b
                        ${isDarkMode ? 'bg-indigo-800 text-white' : 'bg-indigo-500 text-white'}
                      `}
                      style={{ gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)` }}
                    >
                      <div className="p-2 pl-4 font-semibold">
                        {sistema}
                      </div>
                      <div className="col-span-full"></div>
                    </div>

                    {mostrarSubsistemas && subsistemas.map((subsistema, subsistemaIndex) => (
                      <React.Fragment key={`subsistema-${proyectoIndex}-${sistemaIndex}-${subsistemaIndex}`}>
                        {/* Subsystem Header */}
                        <div 
                          className={`
                            grid border-b
                            ${isDarkMode ? 'bg-indigo-700/50 text-white' : 'bg-indigo-300 text-gray-800'}
                          `}
                          style={{ gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)` }}
                        >
                          <div className="p-1 pl-6 font-medium text-sm">
                            {subsistema}
                          </div>
                          <div className="col-span-full"></div>
                        </div>

                        {/* Activities for this subsystem */}
                        {data
                          .filter(item => item.proyecto === proyecto && item.sistema === sistema && item.subsistema === subsistema)
                          .map((item, itemIndex) => (
                            <div 
                              key={`activity-${item.id}`}
                              className="grid border-b relative"
                              style={{ 
                                gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
                                backgroundColor: getRowBackgroundColor(itemIndex, isDarkMode)
                              }}
                            >
                              <div className="p-2 pl-8 border-r border-gray-200 dark:border-gray-700 flex items-center">
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

                                {/* Individual ITR items as bars instead of points */}
                                {item.itrbsAsociados.map((itrb, itrbIndex) => {
                                  const itrbStatus = itrb.estado || "En curso";
                                  
                                  // Calculate dates for the ITR bar
                                  // Use the activity's start date or ITR's specific start date if available
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
                          ))}
                      </React.Fragment>
                    ))}

                    {/* If subsystems are hidden, show activities directly under system */}
                    {!mostrarSubsistemas && (
                      <>
                        {data
                          .filter(item => item.proyecto === proyecto && item.sistema === sistema)
                          .map((item, itemIndex) => (
                            <div 
                              key={`activity-direct-${item.id}`}
                              className="grid border-b relative"
                              style={{ 
                                gridTemplateColumns: `minmax(200px, auto) repeat(${axisDates.length}, 1fr)`,
                                backgroundColor: getRowBackgroundColor(itemIndex, isDarkMode)
                              }}
                            >
                              <div className="p-2 pl-6 border-r border-gray-200 dark:border-gray-700 flex items-center">
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
                                    backgroundColor: item.tieneVencidos ? "#ef4444" : item.progreso === 100 ? "#22c55e" : "#f59e0b"
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
                                      key={`itrb-direct-${itrb.id}`}
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
                          ))}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </ScrollArea>
      
      {/* Tooltip for activity */}
      {hoveredItem && (
        <GanttTooltip 
          item={hoveredItem} 
          position={tooltipPosition} 
        />
      )}
      
      {/* ITRB Tooltip */}
      {hoveredItrb && (
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
              {format(hoveredItrb.fechaInicio, "dd/MM/yyyy", { locale: es })}
            </div>
            
            <div className="text-gray-500 dark:text-gray-400">Fecha límite:</div>
            <div className="font-medium">
              {format(hoveredItrb.fechaFin, "dd/MM/yyyy", { locale: es })}
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
                  {hoveredItrb.cantidadRealizada}/{hoveredItrb.cantidadTotal} ({hoveredItrb.progreso}%)
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {mostrarLeyenda && (
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
      )}
    </div>
  );
};

export default GanttBarChart;
