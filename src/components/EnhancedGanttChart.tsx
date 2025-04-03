
import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Actividad, ITRB, FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, ZoomIn, ZoomOut, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths, subMonths, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

interface GanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<GanttChartProps> = ({ filtros, configuracion }) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const [hoveredItem, setHoveredItem] = useState<{ id: string, tipo: "actividad" | "itrb" } | null>(null);
  
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
      
      if (filtros.estadoITRB && itrb.estado !== filtros.estadoITRB) {
        return false;
      }
      
      if (filtros.ccc !== undefined && itrb.ccc !== filtros.ccc) {
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
  
  // Destructure the timeConfig variables for easier access
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
        actividades: Actividad[];
        itrbsPorActividad: Record<string, ITRB[]>;
      }[];
    }[] = [];
    
    actividadesFiltradas.forEach(actividad => {
      const proyectoIndex = resultado.findIndex(p => p.proyectoId === actividad.proyectoId);
      const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
      
      if (proyectoIndex === -1) {
        resultado.push({
          proyectoId: actividad.proyectoId,
          proyectoNombre: proyecto ? proyecto.titulo : `Proyecto ${actividad.proyectoId}`,
          sistemas: [{
            nombre: actividad.sistema,
            actividades: [actividad],
            itrbsPorActividad: { [actividad.id]: [] }
          }]
        });
      } else {
        const sistemaIndex = resultado[proyectoIndex].sistemas.findIndex(s => s.nombre === actividad.sistema);
        
        if (sistemaIndex === -1) {
          resultado[proyectoIndex].sistemas.push({
            nombre: actividad.sistema,
            actividades: [actividad],
            itrbsPorActividad: { [actividad.id]: [] }
          });
        } else {
          resultado[proyectoIndex].sistemas[sistemaIndex].actividades.push(actividad);
          resultado[proyectoIndex].sistemas[sistemaIndex].itrbsPorActividad[actividad.id] = [];
        }
      }
    });
    
    itrbFiltrados.forEach(itrb => {
      const actividadId = itrb.actividadId;
      const actividad = actividadesFiltradas.find(a => a.id === actividadId);
      
      if (actividad) {
        const proyectoIndex = resultado.findIndex(p => p.proyectoId === actividad.proyectoId);
        if (proyectoIndex !== -1) {
          const sistemaIndex = resultado[proyectoIndex].sistemas.findIndex(s => s.nombre === actividad.sistema);
          if (sistemaIndex !== -1) {
            if (!resultado[proyectoIndex].sistemas[sistemaIndex].itrbsPorActividad[actividadId]) {
              resultado[proyectoIndex].sistemas[sistemaIndex].itrbsPorActividad[actividadId] = [];
            }
            
            resultado[proyectoIndex].sistemas[sistemaIndex].itrbsPorActividad[actividadId].push(itrb);
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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-3 border-b mb-2">
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
        <div className="relative" style={{ minWidth: timeSlots.length * slotWidth + 300 }}>
          <div className="sticky top-0 z-10 flex border-b bg-white dark:bg-gray-900" style={{ marginLeft: "300px" }}>
            {timeSlots.map((slot, index) => {
              const isWeekend = slot.getDay() === 0 || slot.getDay() === 6;
              const isFirstOfMonth = slot.getDate() === 1;
              const displayDate = viewMode === "month" 
                ? (isFirstOfMonth ? format(slot, "MMM", {locale: es}) : slot.getDate().toString()) 
                : format(slot, "EEE d", {locale: es});
              
              return (
                <div 
                  key={index}
                  className={`text-center text-xs p-1 border-r flex-shrink-0 ${isWeekend ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                  style={{ width: `${slotWidth}px`, borderBottom: isFirstOfMonth ? "2px solid #cbd5e1" : "" }}
                >
                  {displayDate}
                </div>
              );
            })}
          </div>
          
          {timeSlots.some(d => d.toDateString() === new Date().toDateString()) && (
            <div className="absolute top-7 bottom-0 w-px bg-red-500 z-5" 
                 style={{ 
                   left: `${300 + timeSlots.findIndex(d => d.toDateString() === new Date().toDateString()) * slotWidth + slotWidth/2}px` 
                 }}>
            </div>
          )}
          
          <div className="mt-1">
            {organizarActividades.map((proyecto, proyectoIndex) => (
              <div key={proyecto.proyectoId} className="mb-4">
                <div className="sticky left-0 z-10 flex items-center h-8 bg-indigo-700 text-white font-bold pl-4 pr-2 mb-1">
                  <div className="truncate w-[300px]">{proyecto.proyectoNombre}</div>
                </div>
                
                {proyecto.sistemas.map((sistema, sistemaIndex) => (
                  <div key={`${proyecto.proyectoId}-${sistema.nombre}`} className="mb-1">
                    <div className="sticky left-0 z-10 flex items-center h-7 bg-indigo-500 text-white pl-8 pr-2">
                      <div className="truncate w-[300px]">{sistema.nombre}</div>
                    </div>
                    
                    {sistema.actividades.map((actividad, actividadIndex) => {
                      const fechaInicio = new Date(actividad.fechaInicio);
                      const fechaFin = new Date(actividad.fechaFin);
                      const { left, width } = getItemPosition(fechaInicio, fechaFin);
                      
                      const activityItrbs = sistema.itrbsPorActividad[actividad.id] || [];
                      
                      if (width === 0) return null;
                      
                      return (
                        <div key={actividad.id}>
                          <div className="relative flex items-center h-7 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div className="sticky left-0 z-10 bg-white dark:bg-gray-900 flex items-center h-full pl-12 pr-2 border-b w-[300px]">
                              <div className="truncate text-sm">
                                {actividad.nombre}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({activityItrbs.length} ITR)
                                </span>
                              </div>
                            </div>
                            
                            <div 
                              className={`absolute h-5 rounded-sm shadow-md flex items-center justify-center text-xs text-white overflow-hidden
                                        ${hoveredItem?.id === actividad.id ? "ring-2 ring-offset-2 ring-blue-500 z-20" : ""}`}
                              style={{ 
                                left: `${300 + left}px`, 
                                width: `${width}px`,
                                backgroundColor: "#64748b",
                                borderColor: "#475569"
                              }}
                              onMouseEnter={() => setHoveredItem({ id: actividad.id, tipo: "actividad" })}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              {width > 50 && (
                                <span className="px-2 truncate">
                                  {actividad.nombre}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {activityItrbs.map((itrb, itrbIndex) => {
                            const fechaInicio = new Date(actividad.fechaInicio);
                            const fechaLimite = new Date(itrb.fechaLimite);
                            const { left, width } = getItemPosition(fechaInicio, fechaLimite);
                            const colors = getColorByEstado(itrb.estado);
                            
                            if (width === 0) return null;
                            
                            return (
                              <div key={itrb.id} className="relative flex items-center h-7 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <div className="sticky left-0 z-10 bg-white dark:bg-gray-900 flex items-center h-full pl-16 pr-2 border-b w-[300px]">
                                  <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                                    {itrb.descripcion.substring(0, 25)}{itrb.descripcion.length > 25 ? '...' : ''}
                                  </div>
                                </div>
                                
                                <div 
                                  className={`absolute h-4 rounded-full flex items-center justify-center text-xs text-white overflow-hidden
                                             ${hoveredItem?.id === itrb.id ? "ring-2 ring-offset-1 ring-blue-500 z-20" : ""}`}
                                  style={{ 
                                    left: `${300 + left}px`, 
                                    width: `${width}px`,
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border
                                  }}
                                  onMouseEnter={() => setHoveredItem({ id: itrb.id, tipo: "itrb" })}
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  {width > 50 && (
                                    <span className="px-2 truncate">
                                      {itrb.descripcion} ({itrb.cantidadRealizada}/{itrb.cantidadTotal})
                                    </span>
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
        </div>
      </ScrollArea>
      
      {configuracion.mostrarLeyenda && (
        <div className="flex justify-center mt-4 space-x-4 pb-4">
          <div className="flex items-center">
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

export default EnhancedGanttChart;
