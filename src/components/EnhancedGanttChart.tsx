
import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Actividad, ITRB, FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, ZoomIn, ZoomOut, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths, subMonths, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import "@/components/gantt/styles/EnhancedGantt.css";

interface GanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<GanttChartProps> = ({ filtros, configuracion }) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const [hoveredItem, setHoveredItem] = useState<{ id: string, tipo: "actividad" | "itrb" | "sistema" | "subsistema" } | null>(null);
  
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(actividad => {
      if (filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
        return false;
      }
      
      if (filtros.sistema && actividad.sistema !== filtros.sistema) {
        return false;
      }
      
      if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
        return false;
      }
      
      if (filtros.busquedaActividad && !actividad.nombre.toLowerCase().includes(filtros.busquedaActividad.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [actividades, filtros]);
  
  const itrbFiltrados = useMemo(() => {
    const actividadesIds = actividadesFiltradas.map(a => a.id);
    
    return itrbItems.filter(itrb => {
      if (!actividadesIds.includes(itrb.actividadId)) {
        return false;
      }
      
      if (filtros.estadoITRB && filtros.estadoITRB !== "todos" && itrb.estado !== filtros.estadoITRB) {
        return false;
      }
      
      // Corregido: Usar mcc en lugar de ccc
      if (filtros.mcc !== undefined && itrb.mcc !== filtros.mcc) {
        return false;
      }
      
      if (filtros.tareaVencida && itrb.estado !== "Vencido") {
        return false;
      }
      
      return true;
    });
  }, [itrbItems, actividadesFiltradas, filtros]);
  
  const timeConfig = useMemo(() => {
    let start = new Date(currentStartDate);
    let end, slots, width;
    
    switch (viewMode) {
      case "month":
        start.setDate(1);
        end = addMonths(start, 3);
        slots = [];
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          slots.push(new Date(d));
        }
        width = 20;
        break;
      case "week":
        const dayOfWeek = start.getDay();
        start = new Date(start.setDate(start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)));
        end = addWeeks(start, 4);
        slots = [];
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          slots.push(new Date(d));
        }
        width = 40;
        break;
      case "day":
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 14);
        slots = [];
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          slots.push(new Date(d));
        }
        width = 80;
        break;
      default:
        start.setDate(1);
        end = addMonths(start, 3);
        slots = [];
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          slots.push(new Date(d));
        }
        width = 20;
    }
    
    return { 
      viewStartDate: start,
      viewEndDate: end,
      timeSlots: slots,
      slotWidth: width
    };
  }, [currentStartDate, viewMode]);
  
  const { viewStartDate, viewEndDate, timeSlots, slotWidth } = timeConfig;
  
  const handleChangeViewMode = (mode: "month" | "week" | "day") => {
    setViewMode(mode);
  };
  
  const handleNavigateBack = () => {
    switch (viewMode) {
      case "month":
        setCurrentStartDate(subMonths(currentStartDate, 1));
        break;
      case "week":
        setCurrentStartDate(subWeeks(currentStartDate, 1));
        break;
      case "day":
        const newDate = new Date(currentStartDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentStartDate(newDate);
        break;
    }
  };
  
  const handleNavigateForward = () => {
    switch (viewMode) {
      case "month":
        setCurrentStartDate(addMonths(currentStartDate, 1));
        break;
      case "week":
        setCurrentStartDate(addWeeks(currentStartDate, 1));
        break;
      case "day":
        const newDate = new Date(currentStartDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentStartDate(newDate);
        break;
    }
  };
  
  const handleTodayView = () => {
    setCurrentStartDate(new Date());
  };
  
  const getItemPosition = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate) < viewStartDate ? viewStartDate : new Date(startDate);
    const end = new Date(endDate) > viewEndDate ? viewEndDate : new Date(endDate);
    
    const totalDays = timeSlots.length;
    const startDayIndex = timeSlots.findIndex(d => d.toDateString() === start.toDateString());
    let endDayIndex = timeSlots.findIndex(d => d.toDateString() === end.toDateString());
    
    if (endDayIndex === -1) endDayIndex = totalDays - 1;
    if (startDayIndex === -1) return { left: 0, width: 0 };
    
    const left = startDayIndex * slotWidth;
    const width = (endDayIndex - startDayIndex + 1) * slotWidth;
    
    return { left, width };
  };
  
  const getColorByEstado = (estado: string) => {
    switch (estado) {
      case "Completado": return { bg: "#22c55e", border: "#15803d" };
      case "En curso": return { bg: "#f59e0b", border: "#d97706" };
      case "Vencido": return { bg: "#ef4444", border: "#b91c1c" };
      default: return { bg: "#94a3b8", border: "#64748b" };
    }
  };
  
  const organizarActividades = useMemo(() => {
    const resultado: {
      proyectoId: string;
      proyectoNombre: string;
      sistemas: {
        nombre: string;
        subsistemas: {
          nombre: string;
          actividades: Actividad[];
          itrbsPorActividad: Record<string, ITRB[]>;
        }[];
      }[];
    }[] = [];
    
    actividadesFiltradas.forEach(actividad => {
      let proyectoEntry = resultado.find(p => p.proyectoId === actividad.proyectoId);
      const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
      
      if (!proyectoEntry) {
        proyectoEntry = {
          proyectoId: actividad.proyectoId,
          proyectoNombre: proyecto ? proyecto.titulo : `Proyecto ${actividad.proyectoId}`,
          sistemas: []
        };
        resultado.push(proyectoEntry);
      }
      
      let sistemaEntry = proyectoEntry.sistemas.find(s => s.nombre === actividad.sistema);
      
      if (!sistemaEntry) {
        sistemaEntry = {
          nombre: actividad.sistema,
          subsistemas: []
        };
        proyectoEntry.sistemas.push(sistemaEntry);
      }
      
      let subsistemaEntry = sistemaEntry.subsistemas.find(s => s.nombre === actividad.subsistema);
      
      if (!subsistemaEntry) {
        subsistemaEntry = {
          nombre: actividad.subsistema,
          actividades: [],
          itrbsPorActividad: {}
        };
        sistemaEntry.subsistemas.push(subsistemaEntry);
      }
      
      subsistemaEntry.actividades.push(actividad);
      subsistemaEntry.itrbsPorActividad[actividad.id] = [];
    });
    
    itrbFiltrados.forEach(itrb => {
      const actividadId = itrb.actividadId;
      const actividad = actividadesFiltradas.find(a => a.id === actividadId);
      
      if (actividad) {
        const proyectoEntry = resultado.find(p => p.proyectoId === actividad.proyectoId);
        if (proyectoEntry) {
          const sistemaEntry = proyectoEntry.sistemas.find(s => s.nombre === actividad.sistema);
          if (sistemaEntry) {
            const subsistemaEntry = sistemaEntry.subsistemas.find(s => s.nombre === actividad.subsistema);
            if (subsistemaEntry) {
              if (!subsistemaEntry.itrbsPorActividad[actividadId]) {
                subsistemaEntry.itrbsPorActividad[actividadId] = [];
              }
              subsistemaEntry.itrbsPorActividad[actividadId].push(itrb);
            }
          }
        }
      }
    });
    
    return resultado;
  }, [actividadesFiltradas, itrbFiltrados, proyectos]);
  
  if (actividadesFiltradas.length === 0) {
    return (
      <div className="border dark:border-gray-700 rounded-lg p-8 text-center text-muted-foreground bg-muted/20 h-full flex items-center justify-center">
        <div>
          <p className="mb-2">No hay actividades disponibles para mostrar</p>
          <p className="text-sm">Agregue actividades o modifique los filtros aplicados</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full gantt-chart">
      <div className="flex justify-between items-center p-3 border-b mb-2 gantt-header">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleNavigateBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleTodayView}>
            <Calendar className="h-4 w-4 mr-1" />
            Hoy
          </Button>
          <Button size="sm" variant="outline" onClick={handleNavigateForward}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium ml-2">
            {format(viewStartDate, "MMMM yyyy", {locale: es})}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Select value={viewMode} onValueChange={(value: "month" | "week" | "day") => handleChangeViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Vista por Mes</SelectItem>
              <SelectItem value="week">Vista por Semana</SelectItem>
              <SelectItem value="day">Vista Detallada</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => handleChangeViewMode(viewMode === "month" ? "week" : viewMode === "week" ? "day" : "month")}>
            {viewMode === "day" ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="relative gantt-container" style={{ minWidth: timeSlots.length * slotWidth + 300 }}>
          {/* Encabezado de fechas */}
          <div className="sticky top-0 z-10 flex border-b gantt-timeline-header" style={{ marginLeft: "300px" }}>
            {timeSlots.map((slot, index) => {
              const isWeekend = slot.getDay() === 0 || slot.getDay() === 6;
              const isFirstOfMonth = slot.getDate() === 1;
              const displayDate = viewMode === "month" 
                ? (isFirstOfMonth ? format(slot, "MMM", {locale: es}) : slot.getDate().toString()) 
                : format(slot, "EEE d", {locale: es});
              
              return (
                <div 
                  key={index}
                  className={`gantt-day-header ${isWeekend ? "gantt-weekend" : ""} ${isFirstOfMonth ? "gantt-month-start" : ""}`}
                  style={{ width: `${slotWidth}px` }}
                >
                  {displayDate}
                </div>
              );
            })}
          </div>
          
          {/* Línea de hoy */}
          {timeSlots.some(d => d.toDateString() === new Date().toDateString()) && (
            <div className="gantt-today-line" 
                 style={{ 
                   left: `${300 + timeSlots.findIndex(d => d.toDateString() === new Date().toDateString()) * slotWidth + slotWidth/2}px` 
                 }}>
            </div>
          )}
          
          {/* Contenido del Gantt */}
          <div className="gantt-content">
            {organizarActividades.map((proyecto, proyectoIndex) => (
              <div key={proyecto.proyectoId} className="gantt-proyecto-container">
                <div className="gantt-proyecto-header">
                  <div className="gantt-label">{proyecto.proyectoNombre}</div>
                </div>
                
                {proyecto.sistemas.map((sistema, sistemaIndex) => (
                  <div key={`${proyecto.proyectoId}-${sistema.nombre}`} className="gantt-sistema-container">
                    <div className="gantt-sistema-header">
                      <div className="gantt-label">{sistema.nombre}</div>
                    </div>
                    
                    {sistema.subsistemas.map((subsistema, subsistemaIndex) => (
                      <div key={`${proyecto.proyectoId}-${sistema.nombre}-${subsistema.nombre}`} className="gantt-subsistema-container">
                        <div className="gantt-subsistema-header">
                          <div className="gantt-label">{subsistema.nombre}</div>
                        </div>
                        
                        {subsistema.actividades.map((actividad, actividadIndex) => {
                          const fechaInicio = new Date(actividad.fechaInicio);
                          const fechaFin = new Date(actividad.fechaFin);
                          const { left, width } = getItemPosition(fechaInicio, fechaFin);
                          
                          const activityItrbs = subsistema.itrbsPorActividad[actividad.id] || [];
                          const totalItrs = activityItrbs.length;
                          
                          if (width === 0) return null;
                          
                          // Calcular el progreso total de la actividad basado en los ITRs
                          const completedItrs = activityItrbs.filter(itr => itr.estado === "Completado").length;
                          const progressPercentage = totalItrs > 0 ? (completedItrs / totalItrs) * 100 : 0;
                          
                          return (
                            <div key={actividad.id} className="gantt-actividad-container">
                              <div className="gantt-actividad-row">
                                <div className="gantt-actividad-label">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-sm font-medium truncate">{actividad.nombre}</span>
                                    <span className="text-xs text-gray-500 ml-1">{totalItrs} ITR</span>
                                  </div>
                                </div>
                                
                                <div 
                                  className={`gantt-bar gantt-actividad-bar ${hoveredItem?.id === actividad.id ? "gantt-bar-hovered" : ""}`}
                                  style={{ 
                                    left: `${300 + left}px`, 
                                    width: `${width}px`
                                  }}
                                  onMouseEnter={() => setHoveredItem({ id: actividad.id, tipo: "actividad" })}
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  {/* Barra de progreso interna */}
                                  <div 
                                    className="gantt-progress-bar"
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                  
                                  {width > 50 && (
                                    <div className="gantt-bar-label">
                                      {actividad.nombre} ({progressPercentage.toFixed(0)}%)
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Agrupar ITRs por rango de fechas si aplica */}
                              {activityItrbs.map((itrb, itrbIndex) => {
                                const fechaInicio = new Date(itrb.fechaInicio || actividad.fechaInicio);
                                const fechaLimite = new Date(itrb.fechaLimite);
                                const { left, width } = getItemPosition(fechaInicio, fechaLimite);
                                const colors = getColorByEstado(itrb.estado);
                                
                                if (width === 0) return null;
                                
                                // Calcular progreso del ITR
                                const itrbProgress = itrb.cantidadRealizada && itrb.cantidadTotal ? 
                                  (itrb.cantidadRealizada / itrb.cantidadTotal) * 100 : 0;
                                
                                return (
                                  <div key={itrb.id} className="gantt-itrb-row">
                                    <div className="gantt-itrb-label">
                                      <span className="truncate text-xs">{itrb.descripcion}</span>
                                    </div>
                                    
                                    <div 
                                      className={`gantt-bar gantt-itrb-bar ${hoveredItem?.id === itrb.id ? "gantt-bar-hovered" : ""}`}
                                      style={{ 
                                        left: `${300 + left}px`, 
                                        width: `${width}px`,
                                        backgroundColor: colors.bg,
                                      }}
                                      onMouseEnter={() => setHoveredItem({ id: itrb.id, tipo: "itrb" })}
                                      onMouseLeave={() => setHoveredItem(null)}
                                    >
                                      {/* Barra de progreso interna */}
                                      <div 
                                        className="gantt-progress-bar"
                                        style={{ 
                                          width: `${itrbProgress}%`,
                                          backgroundColor: colors.border 
                                        }}
                                      ></div>
                                      
                                      {width > 50 && (
                                        <div className="gantt-bar-label">
                                          {itrb.descripcion.substring(0, 15)}{itrb.descripcion.length > 15 ? '...' : ''} 
                                          ({itrb.cantidadRealizada}/{itrb.cantidadTotal})
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
      
      {configuracion.mostrarLeyenda && (
        <div className="gantt-legend">
          <div className="gantt-legend-item">
            <div className="gantt-legend-color" style={{ backgroundColor: "#22c55e" }}></div>
            <span>Completado</span>
          </div>
          <div className="gantt-legend-item">
            <div className="gantt-legend-color" style={{ backgroundColor: "#f59e0b" }}></div>
            <span>En curso</span>
          </div>
          <div className="gantt-legend-item">
            <div className="gantt-legend-color" style={{ backgroundColor: "#ef4444" }}></div>
            <span>Vencido</span>
          </div>
          <div className="gantt-legend-item">
            <div className="gantt-legend-color" style={{ backgroundColor: "#64748b" }}></div>
            <span>Actividad</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGanttChart;
