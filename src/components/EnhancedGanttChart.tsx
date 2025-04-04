
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { addDays, subDays, startOfMonth, endOfMonth, addMonths, format, isWithinInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

// Importación de componentes y hooks existentes
import GanttLoadingState from "./gantt/GanttLoadingState";
import GanttEmptyState from "./gantt/GanttEmptyState";
import GanttNavigationControls from "./gantt/GanttNavigationControls";
import { useGanttData } from "./gantt/hooks/useGanttData";
import { generateSampleData } from "./gantt/utils/sampleData";

// Import custom styles for enhanced Gantt
import "./gantt/styles/EnhancedGantt.css";

interface EnhancedGanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({ 
  filtros, 
  configuracion 
}) => {
  const { actividades: appActividades, itrbItems: appItrbItems, proyectos: appProyectos } = useAppContext();

  const today = new Date();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState<Date>(subDays(startOfMonth(today), 7));
  const [currentEndDate, setCurrentEndDate] = useState<Date>(endOfMonth(today));
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);
  const [hoveredITRB, setHoveredITRB] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [sampleData, setSampleData] = useState<{
    actividades: any[];
    itrbItems: any[];
    proyectos: any[];
  }>({ actividades: [], itrbItems: [], proyectos: [] });

  useEffect(() => {
    setSampleData(generateSampleData());
  }, []);

  const actividades = usingSampleData ? sampleData.actividades : appActividades;
  const itrbItems = usingSampleData ? sampleData.itrbItems : appItrbItems;
  const proyectos = usingSampleData ? sampleData.proyectos : appProyectos;

  const mostrarSubsistemas = configuracion.mostrarSubsistemas !== undefined 
    ? configuracion.mostrarSubsistemas 
    : true;

  const { ganttData } = useGanttData(actividades, itrbItems, proyectos, filtros);

  // Calculate dates for timeline based on current view and zoom level
  const axisDatesMemo = useMemo(() => {
    const result: Date[] = [];
    let currentDate = new Date(currentStartDate);
    
    while (currentDate <= currentEndDate) {
      result.push(new Date(currentDate));
      
      if (viewMode === "day") {
        currentDate = addDays(currentDate, 1);
      } else if (viewMode === "week") {
        currentDate = addDays(currentDate, 1);
      } else {
        currentDate = addDays(currentDate, 1);
      }
    }
    
    return result;
  }, [currentStartDate, currentEndDate, viewMode]);

  const toggleSampleData = useCallback(() => {
    setUsingSampleData(prev => !prev);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [usingSampleData]);

  const navigateTime = (direction: "prev" | "next" | "today") => {
    let newStartDate = currentStartDate;
    let newEndDate = currentEndDate;

    if (direction === "today") {
      newStartDate = subDays(startOfMonth(today), 7);
      newEndDate = endOfMonth(today);
    } else if (direction === "prev") {
      if (viewMode === "month") {
        newStartDate = addMonths(currentStartDate, -1);
        newEndDate = endOfMonth(newStartDate);
      } else if (viewMode === "week") {
        newStartDate = addDays(currentStartDate, -7);
        newEndDate = addDays(newStartDate, 14);
      } else {
        newStartDate = addDays(currentStartDate, -1);
        newEndDate = addDays(newStartDate, 2);
      }
    } else if (direction === "next") {
      if (viewMode === "month") {
        newStartDate = addMonths(currentStartDate, 1);
        newEndDate = endOfMonth(newStartDate);
      } else if (viewMode === "week") {
        newStartDate = addDays(currentStartDate, 7);
        newEndDate = addDays(newStartDate, 14);
      } else {
        newStartDate = addDays(currentStartDate, 1);
        newEndDate = addDays(newStartDate, 2);
      }
    }

    setCurrentStartDate(newStartDate);
    setCurrentEndDate(newEndDate);
  };

  const handleViewModeChange = (newMode: "month" | "week" | "day") => {
    setViewMode(newMode);
    
    // Adjust date range based on view mode
    const today = new Date();
    
    if (newMode === "month") {
      setCurrentStartDate(subDays(startOfMonth(today), 7));
      setCurrentEndDate(endOfMonth(today));
    } else if (newMode === "week") {
      setCurrentStartDate(today);
      setCurrentEndDate(addDays(today, 14));
    } else if (newMode === "day") {
      setCurrentStartDate(today);
      setCurrentEndDate(addDays(today, 2));
    }
  };

  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
  };

  // Calculate position on the timeline
  const calculatePosition = (date: Date): number => {
    if (!isWithinInterval(date, { start: currentStartDate, end: currentEndDate })) {
      if (date < currentStartDate) return 0;
      if (date > currentEndDate) return 100;
    }
    
    const timelineStart = currentStartDate.getTime();
    const timelineEnd = currentEndDate.getTime();
    const dateTime = date.getTime();
    
    // Calculate percentage position
    const position = ((dateTime - timelineStart) / (timelineEnd - timelineStart)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  useEffect(() => {
    const exportPDFHandler = () => {
      console.log("Export PDF");
      // Implementación de exportación PDF
    };

    const exportExcelHandler = () => {
      console.log("Export Excel");
      // Implementación de exportación Excel
    };

    const toggleDemoDataHandler = () => {
      toggleSampleData();
    };

    window.addEventListener('export-gantt-pdf', exportPDFHandler);
    window.addEventListener('export-gantt-excel', exportExcelHandler);
    window.addEventListener('toggle-demo-data', toggleDemoDataHandler);

    return () => {
      window.removeEventListener('export-gantt-pdf', exportPDFHandler);
      window.removeEventListener('export-gantt-excel', exportExcelHandler);
      window.removeEventListener('toggle-demo-data', toggleDemoDataHandler);
    };
  }, [toggleSampleData]);

  // Handle tooltip display
  const handleMouseOver = (e: React.MouseEvent, item: any) => {
    setHoveredItem(item);
    setHoveredITRB(null);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleITRBMouseOver = (e: React.MouseEvent, itrb: any, item: any) => {
    setHoveredITRB({ ...itrb, actividad: item });
    setHoveredItem(null);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    e.stopPropagation();
  };

  const handleMouseOut = () => {
    setHoveredItem(null);
    setHoveredITRB(null);
  };

  // Get gantt chart height based on configuration
  const getGanttHeight = () => {
    switch (configuracion.tamano) {
      case "pequeno": return "h-[400px]";
      case "mediano": return "h-[600px]";
      case "grande": return "h-[800px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
    }
  };

  // Group data by project, system and subsystem for hierarchical display
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, Record<string, any[]>>> = {};
    
    ganttData.forEach(item => {
      const proyecto = item.proyecto;
      const sistema = item.sistema;
      const subsistema = item.subsistema;
      
      if (!result[proyecto]) {
        result[proyecto] = {};
      }
      
      if (!result[proyecto][sistema]) {
        result[proyecto][sistema] = {};
      }
      
      if (!result[proyecto][sistema][subsistema]) {
        result[proyecto][sistema][subsistema] = [];
      }
      
      result[proyecto][sistema][subsistema].push(item);
    });
    
    return result;
  }, [ganttData]);

  if (loading) {
    return <GanttLoadingState />;
  }

  if (ganttData.length === 0) {
    return <GanttEmptyState />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm mb-2 p-2">
        <div className="flex justify-between items-center">
          <GanttNavigationControls
            currentStartDate={currentStartDate}
            currentEndDate={currentEndDate}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            onNavigate={navigateTime}
            onViewModeChange={handleViewModeChange}
            onZoomChange={changeZoom}
          />

          <div className="flex items-center mr-4">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              {usingSampleData ? "Usando datos de muestra" : "Datos reales"}
            </span>
            <div 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                usingSampleData ? 'bg-primary' : 'bg-input'
              }`}
              onClick={toggleSampleData}
              role="button"
              tabIndex={0}
            >
              <span 
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  usingSampleData ? 'translate-x-6' : 'translate-x-1'
                }`} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-1 min-h-0 w-full overflow-hidden ${getGanttHeight()}`}>
        <ScrollArea className="h-full">
          <div className="relative gantt-chart min-w-[800px]">
            {/* Timeline header */}
            <div className="grid gantt-header sticky top-0 z-10"
                 style={{ gridTemplateColumns: "220px repeat(" + axisDatesMemo.length + ", minmax(30px, 1fr))" }}>
              <div className="px-2 py-3 font-semibold border-b border-r">Actividad</div>
              {axisDatesMemo.map((date, i) => (
                <div key={`date-${i}`} 
                     className={`text-center text-xs py-2 border-b border-r
                       ${isSameDay(date, today) ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' : ''}`}>
                  {viewMode === "day" 
                    ? format(date, "HH:mm", { locale: es }) 
                    : viewMode === "week" 
                      ? format(date, "EEE d", { locale: es })
                      : format(date, "d", { locale: es })}
                </div>
              ))}
            </div>

            {/* Today indicator */}
            {isWithinInterval(today, { start: currentStartDate, end: currentEndDate }) && (
              <div className="absolute h-full border-l-2 border-red-500 z-[5] pointer-events-none" 
                   style={{ left: `calc(220px + ${calculatePosition(today)}% * (100% - 220px) / 100)` }}>
              </div>
            )}

            {/* Content */}
            <div className="gantt-body">
              {Object.entries(groupedData).map(([proyecto, sistemas], proyectoIndex) => (
                <React.Fragment key={`proyecto-${proyectoIndex}`}>
                  {/* Proyecto header */}
                  <div className="grid gantt-row gantt-proyecto"
                       style={{ gridTemplateColumns: "220px repeat(" + axisDatesMemo.length + ", minmax(30px, 1fr))" }}>
                    <div className="px-3 py-2 font-bold border-b border-r bg-indigo-800 text-white">
                      {proyecto}
                    </div>
                    <div className="col-span-full"></div>
                  </div>
                  
                  {Object.entries(sistemas).map(([sistema, subsistemas], sistemaIndex) => (
                    <React.Fragment key={`sistema-${proyectoIndex}-${sistemaIndex}`}>
                      {/* Sistema header */}
                      <div className="grid gantt-row gantt-sistema" 
                           style={{ gridTemplateColumns: "220px repeat(" + axisDatesMemo.length + ", minmax(30px, 1fr))" }}>
                        <div className="px-3 py-1.5 font-semibold border-b border-r bg-indigo-600 text-white">
                          {sistema}
                        </div>
                        <div className="col-span-full"></div>
                      </div>
                      
                      {mostrarSubsistemas && Object.entries(subsistemas).map(([subsistema, actividades], subsistemaIndex) => (
                        <React.Fragment key={`subsistema-${proyectoIndex}-${sistemaIndex}-${subsistemaIndex}`}>
                          {/* Subsistema header */}
                          <div className="grid gantt-row gantt-subsistema"
                               style={{ gridTemplateColumns: "220px repeat(" + axisDatesMemo.length + ", minmax(30px, 1fr))" }}>
                            <div className="pl-6 py-1 font-medium text-sm border-b border-r bg-indigo-400 text-white">
                              {subsistema}
                            </div>
                            <div className="col-span-full"></div>
                          </div>
                          
                          {/* Actividades del subsistema */}
                          {actividades.map((actividad, actividadIndex) => (
                            <div key={`actividad-${actividad.id}`} 
                                 className={`grid gantt-row gantt-actividad relative ${actividadIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/20' : ''}`}
                                 style={{ 
                                   gridTemplateColumns: "220px repeat(" + axisDatesMemo.length + ", minmax(30px, 1fr))",
                                   height: `${40 + (actividad.itrbsAsociados.length * 24)}px` 
                                 }}>
                              <div className="pl-8 py-2 border-b border-r flex items-center">
                                <span className="text-sm font-medium truncate">{actividad.nombre}</span>
                                {actividad.itrbsAsociados.length > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                    {actividad.itrbsAsociados.length}
                                  </span>
                                )}
                              </div>
                              
                              {/* Barra de la actividad */}
                              <div className="col-span-full h-full relative">
                                <div 
                                  className="absolute h-6 rounded-sm cursor-pointer top-2"
                                  style={{
                                    left: `${calculatePosition(new Date(actividad.fechaInicio))}%`,
                                    width: `${calculatePosition(new Date(actividad.fechaFin)) - calculatePosition(new Date(actividad.fechaInicio))}%`,
                                    backgroundColor: actividad.color || '#64748b',
                                    opacity: 0.9
                                  }}
                                  onMouseOver={(e) => handleMouseOver(e, actividad)}
                                  onMouseOut={handleMouseOut}
                                >
                                  <div 
                                    className="h-full rounded-sm flex items-center px-2 overflow-hidden"
                                    style={{ 
                                      width: `${actividad.progreso}%`,
                                      backgroundColor: actividad.tieneVencidos ? '#ef4444' : (actividad.progreso === 100 ? '#22c55e' : '#eab308')
                                    }}
                                  >
                                    <span className="text-xs text-white font-medium whitespace-nowrap">
                                      {actividad.progreso}%
                                    </span>
                                  </div>
                                </div>
                                
                                {/* ITRBs asociados */}
                                {actividad.itrbsAsociados.map((itrb, itrbIndex) => {
                                  const itrbStartDate = new Date(itrb.fechaInicio || actividad.fechaInicio);
                                  const itrbEndDate = new Date(itrb.fechaVencimiento || itrb.fechaLimite || actividad.fechaFin);
                                  const itrbProgress = itrb.estado === 'Completado' ? 100 : itrb.estado === 'Vencido' ? 0 : 50;
                                  const itrbColor = itrb.estado === 'Completado' ? '#22c55e' : 
                                                   itrb.estado === 'Vencido' ? '#ef4444' : '#3b82f6';
                                  
                                  return (
                                    <div 
                                      key={`itrb-${itrb.id}`}
                                      className="absolute h-4 rounded-sm cursor-pointer hover:h-5 transition-all"
                                      style={{
                                        left: `${calculatePosition(itrbStartDate)}%`,
                                        width: `${calculatePosition(itrbEndDate) - calculatePosition(itrbStartDate)}%`,
                                        top: `${38 + (itrbIndex * 24)}px`,
                                        backgroundColor: '#94a3b8',
                                        opacity: 0.9
                                      }}
                                      onMouseOver={(e) => handleITRBMouseOver(e, itrb, actividad)}
                                      onMouseOut={handleMouseOut}
                                    >
                                      <div 
                                        className="h-full rounded-sm"
                                        style={{ 
                                          width: `${itrbProgress}%`, 
                                          backgroundColor: itrbColor,
                                          transition: 'width 0.3s ease-in-out'
                                        }}
                                      >
                                        <div className="px-1 text-[10px] text-white truncate">
                                          {itrb.descripcion || `ITRB ${itrbIndex + 1}`}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Si no se muestran subsistemas, mostrar las actividades directamente bajo el sistema */}
                      {!mostrarSubsistemas && Object.values(subsistemas).flat().map((actividad, actividadIndex) => (
                        <div key={`actividad-dir-${actividad.id}`} 
                             className={`grid gantt-row gantt-actividad relative ${actividadIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/20' : ''}`}
                             style={{ 
                               gridTemplateColumns: "220px repeat(" + axisDatesMemo.length + ", minmax(30px, 1fr))",
                               height: `${40 + (actividad.itrbsAsociados.length * 24)}px` 
                             }}>
                          <div className="pl-6 py-2 border-b border-r flex items-center">
                            <span className="text-sm font-medium truncate">{actividad.nombre}</span>
                            {actividad.itrbsAsociados.length > 0 && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                {actividad.itrbsAsociados.length}
                              </span>
                            )}
                          </div>
                          
                          {/* Barra de la actividad */}
                          <div className="col-span-full h-full relative">
                            <div 
                              className="absolute h-6 rounded-sm cursor-pointer top-2"
                              style={{
                                left: `${calculatePosition(new Date(actividad.fechaInicio))}%`,
                                width: `${calculatePosition(new Date(actividad.fechaFin)) - calculatePosition(new Date(actividad.fechaInicio))}%`,
                                backgroundColor: actividad.color || '#64748b',
                                opacity: 0.9
                              }}
                              onMouseOver={(e) => handleMouseOver(e, actividad)}
                              onMouseOut={handleMouseOut}
                            >
                              <div 
                                className="h-full rounded-sm flex items-center px-2 overflow-hidden"
                                style={{ 
                                  width: `${actividad.progreso}%`,
                                  backgroundColor: actividad.tieneVencidos ? '#ef4444' : (actividad.progreso === 100 ? '#22c55e' : '#eab308')
                                }}
                              >
                                <span className="text-xs text-white font-medium whitespace-nowrap">
                                  {actividad.progreso}%
                                </span>
                              </div>
                            </div>
                            
                            {/* ITRBs asociados */}
                            {actividad.itrbsAsociados.map((itrb, itrbIndex) => {
                              const itrbStartDate = new Date(itrb.fechaInicio || actividad.fechaInicio);
                              const itrbEndDate = new Date(itrb.fechaVencimiento || itrb.fechaLimite || actividad.fechaFin);
                              const itrbProgress = itrb.estado === 'Completado' ? 100 : itrb.estado === 'Vencido' ? 0 : 50;
                              const itrbColor = itrb.estado === 'Completado' ? '#22c55e' : 
                                              itrb.estado === 'Vencido' ? '#ef4444' : '#3b82f6';
                              
                              return (
                                <div 
                                  key={`itrb-${itrb.id}`}
                                  className="absolute h-4 rounded-sm cursor-pointer hover:h-5 transition-all"
                                  style={{
                                    left: `${calculatePosition(itrbStartDate)}%`,
                                    width: `${calculatePosition(itrbEndDate) - calculatePosition(itrbStartDate)}%`,
                                    top: `${38 + (itrbIndex * 24)}px`,
                                    backgroundColor: '#94a3b8',
                                    opacity: 0.9
                                  }}
                                  onMouseOver={(e) => handleITRBMouseOver(e, itrb, actividad)}
                                  onMouseOut={handleMouseOut}
                                >
                                  <div 
                                    className="h-full rounded-sm"
                                    style={{ 
                                      width: `${itrbProgress}%`, 
                                      backgroundColor: itrbColor,
                                      transition: 'width 0.3s ease-in-out'
                                    }}
                                  >
                                    <div className="px-1 text-[10px] text-white truncate">
                                      {itrb.descripcion || `ITRB ${itrbIndex + 1}`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Tooltip para actividades */}
      {hoveredItem && (
        <div 
          className="fixed z-50 p-3 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm min-w-[200px] max-w-[300px]"
          style={{ 
            left: tooltipPosition.x + 10, 
            top: tooltipPosition.y + 10,
            transform: tooltipPosition.x > window.innerWidth - 320 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">{hoveredItem.nombre}</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-gray-500 dark:text-gray-400">Progreso:</div>
            <div className="font-medium">{hoveredItem.progreso}%</div>
            <div className="text-gray-500 dark:text-gray-400">Inicio:</div>
            <div>{new Date(hoveredItem.fechaInicio).toLocaleDateString()}</div>
            <div className="text-gray-500 dark:text-gray-400">Fin:</div>
            <div>{new Date(hoveredItem.fechaFin).toLocaleDateString()}</div>
            <div className="text-gray-500 dark:text-gray-400">Sistema:</div>
            <div>{hoveredItem.sistema}</div>
            {mostrarSubsistemas && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Subsistema:</div>
                <div>{hoveredItem.subsistema}</div>
              </>
            )}
            <div className="text-gray-500 dark:text-gray-400">ITRBs:</div>
            <div>{hoveredItem.itrbsAsociados.length}</div>
          </div>
        </div>
      )}

      {/* Tooltip para ITRBs */}
      {hoveredITRB && (
        <div 
          className="fixed z-50 p-3 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm min-w-[200px] max-w-[300px]"
          style={{ 
            left: tooltipPosition.x + 10, 
            top: tooltipPosition.y + 10,
            transform: tooltipPosition.x > window.innerWidth - 320 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">
            {hoveredITRB.descripcion || "ITRB sin descripción"}
          </div>
          <div className="text-xs font-medium text-gray-500 mb-2">
            Parte de: {hoveredITRB.actividad.nombre}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-gray-500 dark:text-gray-400">Estado:</div>
            <div className={`font-medium ${
              hoveredITRB.estado === 'Completado' ? 'text-green-600 dark:text-green-400' : 
              hoveredITRB.estado === 'Vencido' ? 'text-red-600 dark:text-red-400' : 
              'text-blue-600 dark:text-blue-400'
            }`}>
              {hoveredITRB.estado || "En curso"}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Fecha límite:</div>
            <div>{new Date(hoveredITRB.fechaVencimiento || hoveredITRB.fechaLimite).toLocaleDateString()}</div>
            {hoveredITRB.cantidadRealizada !== undefined && hoveredITRB.cantidadTotal !== undefined && (
              <>
                <div className="text-gray-500 dark:text-gray-400">Progreso:</div>
                <div>{hoveredITRB.cantidadRealizada}/{hoveredITRB.cantidadTotal}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Leyenda */}
      {configuracion.mostrarLeyenda && (
        <div className="mt-4 p-2 bg-muted rounded-md">
          <div className="text-sm font-medium mb-2">Leyenda</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-green-500"></div>
              <span className="text-xs">Completado</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-yellow-500"></div>
              <span className="text-xs">En progreso</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-red-500"></div>
              <span className="text-xs">Vencido</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-blue-500"></div>
              <span className="text-xs">ITRB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGanttChart;
