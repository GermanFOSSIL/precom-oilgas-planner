import React, { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Actividad, ITRB, FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GanttBarProps {
  start: Date;
  end: Date;
  color: string;
  label: string;
  ganttStart: Date;
  ganttEnd: Date;
  height: number;
}

interface GanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

// Componente para una barra individual en el gráfico Gantt
const GanttBar: React.FC<GanttBarProps> = ({ 
  start, end, color, label, ganttStart, ganttEnd, height 
}) => {
  const totalDuration = ganttEnd.getTime() - ganttStart.getTime();
  const startOffset = Math.max(0, start.getTime() - ganttStart.getTime());
  const duration = end.getTime() - start.getTime();
  
  const left = (startOffset / totalDuration) * 100;
  const width = (duration / totalDuration) * 100;
  
  return (
    <div 
      className="absolute h-6 rounded-sm text-xs text-white overflow-hidden whitespace-nowrap hover:z-10 hover:shadow-lg transition-shadow cursor-pointer"
      style={{ 
        left: `${left}%`, 
        width: `${width}%`,
        top: `${height}px`,
        backgroundColor: color,
      }}
      title={label}
    >
      <div className="px-2 py-1 truncate">{label}</div>
    </div>
  );
};

// Componente para las líneas verticales de tiempo (meses)
const TimeGrid: React.FC<{
  startDate: Date;
  endDate: Date;
}> = ({ startDate, endDate }) => {
  const months = useMemo(() => {
    const result = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Iniciar en el primer día del mes
    
    while (currentDate <= endDate) {
      result.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return result;
  }, [startDate, endDate]);
  
  const totalDuration = endDate.getTime() - startDate.getTime();
  
  return (
    <div className="absolute inset-0 border-b dark:border-gray-700">
      {months.map((date, index) => {
        const offset = (date.getTime() - startDate.getTime()) / totalDuration * 100;
        return (
          <div key={index} className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-700"
               style={{ left: `${offset}%` }}>
            <div className="absolute -top-7 -left-10 w-20 text-center text-xs text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString("es-ES", { month: 'short', year: 'numeric' })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Componente principal del Gantt
const GanttChart: React.FC<GanttChartProps> = ({ filtros, configuracion }) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  
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
  
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, Record<string, { 
      actividades: Actividad[], 
      itrbs: Record<string, ITRB[]> 
    }>>> = {};
    
    actividadesFiltradas.forEach(actividad => {
      const { proyectoId, sistema, subsistema } = actividad;
      
      if (!result[proyectoId]) {
        result[proyectoId] = {};
      }
      
      if (!result[proyectoId][sistema]) {
        result[proyectoId][sistema] = {};
      }
      
      if (!result[proyectoId][sistema][subsistema]) {
        result[proyectoId][sistema][subsistema] = { 
          actividades: [], 
          itrbs: {} 
        };
      }
      
      result[proyectoId][sistema][subsistema].actividades.push(actividad);
      result[proyectoId][sistema][subsistema].itrbs[actividad.id] = [];
    });
    
    itrbFiltrados.forEach(itrb => {
      const actividad = actividadesFiltradas.find(a => a.id === itrb.actividadId);
      if (actividad) {
        const { proyectoId, sistema, subsistema } = actividad;
        if (result[proyectoId] && 
            result[proyectoId][sistema] && 
            result[proyectoId][sistema][subsistema]) {
          
          if (!result[proyectoId][sistema][subsistema].itrbs[actividad.id]) {
            result[proyectoId][sistema][subsistema].itrbs[actividad.id] = [];
          }
          
          result[proyectoId][sistema][subsistema].itrbs[actividad.id].push(itrb);
        }
      }
    });
    
    return result;
  }, [actividadesFiltradas, itrbFiltrados]);
  
  const { startDate, endDate } = useMemo(() => {
    let earliest = new Date();
    let latest = new Date();
    
    if (actividadesFiltradas.length > 0) {
      earliest = new Date(actividadesFiltradas.reduce(
        (min, act) => act.fechaInicio < min ? act.fechaInicio : min,
        actividadesFiltradas[0].fechaInicio
      ));
      
      latest = new Date(actividadesFiltradas.reduce(
        (max, act) => act.fechaFin > max ? act.fechaFin : max,
        actividadesFiltradas[0].fechaFin
      ));
      
      earliest.setDate(earliest.getDate() - 5);
      latest.setDate(latest.getDate() + 5);
    }
    
    return { startDate: earliest, endDate: latest };
  }, [actividadesFiltradas]);
  
  const getColorByEstado = (estado: string) => {
    switch (estado) {
      case "Completado": return "#22c55e";
      case "En curso": return "#f59e0b";
      case "Vencido": return "#ef4444";
      default: return "#94a3b8";
    }
  };
  
  const calculateTotalHeight = () => {
    let height = 0;
    
    Object.keys(groupedData).forEach(proyectoId => {
      height += 40;
      
      Object.keys(groupedData[proyectoId]).forEach(sistema => {
        height += 40;
        
        Object.keys(groupedData[proyectoId][sistema]).forEach(subsistema => {
          height += 30;
          
          const { actividades } = groupedData[proyectoId][sistema][subsistema];
          height += actividades.length * 30;
          
          let totalItrbCount = 0;
          actividades.forEach(act => {
            const itrbsForActivity = groupedData[proyectoId][sistema][subsistema].itrbs[act.id] || [];
            totalItrbCount += itrbsForActivity.length;
          });
          
          height += totalItrbCount * 25;
        });
      });
    });
    
    return Math.max(height, 200);
  };
  
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
  
  const totalHeight = calculateTotalHeight();
  
  return (
    <ScrollArea className="h-full">
      <div className="w-full overflow-x-auto">
        <div className="relative min-w-[800px]" style={{ height: `${totalHeight}px` }}>
          <div className="h-7 mb-2 sticky top-0 z-10 bg-white dark:bg-slate-800 relative">
            <TimeGrid startDate={startDate} endDate={endDate} />
          </div>
          
          <div className="relative" style={{ height: `${totalHeight - 30}px` }}>
            {Object.entries(groupedData).map(([proyectoId, sistemas], proyectoIndex) => {
              let currentHeight = proyectoIndex === 0 ? 0 : 40 * proyectoIndex;
              
              if (proyectoIndex > 0) {
                Object.keys(groupedData).slice(0, proyectoIndex).forEach(prevProyectoId => {
                  Object.keys(groupedData[prevProyectoId]).forEach(prevSistema => {
                    Object.keys(groupedData[prevProyectoId][prevSistema]).forEach(prevSubsistema => {
                      const { actividades } = groupedData[prevProyectoId][prevSistema][prevSubsistema];
                      currentHeight += 30;
                      currentHeight += actividades.length * 30;
                      
                      let prevItrbCount = 0;
                      actividades.forEach(act => {
                        const itrbsForActivity = groupedData[prevProyectoId][prevSistema][prevSubsistema].itrbs[act.id] || [];
                        prevItrbCount += itrbsForActivity.length;
                      });
                      
                      currentHeight += prevItrbCount * 25;
                    });
                  });
                });
              }
              
              const proyecto = proyectos.find(p => p.id === proyectoId);
              const proyectoTitulo = proyecto ? proyecto.titulo : `Proyecto ${proyectoId}`;
              
              return (
                <React.Fragment key={proyectoId}>
                  <div 
                    className="sticky left-0 font-bold bg-indigo-700 text-white p-2 rounded-sm mb-1 z-10"
                    style={{ top: `${currentHeight}px` }}
                  >
                    {proyectoTitulo}
                  </div>
                  
                  {Object.entries(sistemas).map(([sistema, subsistemas], sistemaIndex) => {
                    currentHeight += 40;
                    
                    if (sistemaIndex > 0) {
                      Object.entries(sistemas).slice(0, sistemaIndex).forEach(
                        ([_, prevSubsistemas]) => {
                          Object.entries(prevSubsistemas).forEach(([_, { actividades }]) => {
                            currentHeight += 30;
                            currentHeight += actividades.length * 30;
                            
                            let prevItrbCount = 0;
                            actividades.forEach(act => {
                              const itrbsForActivity = prevSubsistemas[Object.keys(prevSubsistemas)[0]].itrbs[act.id] || [];
                              prevItrbCount += itrbsForActivity.length;
                            });
                            
                            currentHeight += prevItrbCount * 25;
                          });
                        }
                      );
                    }
                    
                    const sistemaStartHeight = currentHeight;
                    
                    return (
                      <React.Fragment key={`${proyectoId}-${sistema}`}>
                        <div 
                          className="sticky left-0 font-bold bg-indigo-500 text-white p-2 pl-4 rounded-sm mb-1 z-10"
                          style={{ top: `${sistemaStartHeight}px` }}
                        >
                          {sistema}
                        </div>
                        
                        {Object.entries(subsistemas).map(([subsistema, { actividades: acts, itrbs: itrbsByActivityId }], subsistemaIndex) => {
                          currentHeight += 40;
                          
                          if (subsistemaIndex > 0) {
                            Object.entries(subsistemas).slice(0, subsistemaIndex).forEach(
                              ([_, { actividades: prevActs }]) => {
                                currentHeight += 30;
                                currentHeight += prevActs.length * 30;
                                
                                let prevItrbCount = 0;
                                prevActs.forEach(act => {
                                  const prevItrbsByActivityId = subsistemas[Object.keys(subsistemas)[0]].itrbs;
                                  const itrbsForActivity = prevItrbsByActivityId[act.id] || [];
                                  prevItrbCount += itrbsForActivity.length;
                                });
                                
                                currentHeight += prevItrbCount * 25;
                              }
                            );
                          }
                          
                          const subsistemaStartHeight = currentHeight;
                          
                          return (
                            <React.Fragment key={`${proyectoId}-${sistema}-${subsistema}`}>
                              <div 
                                className="sticky left-0 font-semibold bg-indigo-300 dark:bg-indigo-600 text-white p-1 pl-6 rounded-sm mb-1 z-10"
                                style={{ top: `${subsistemaStartHeight}px` }}
                              >
                                {subsistema}
                              </div>
                              
                              {acts.map((actividad, actIndex) => {
                                const actStartHeight = subsistemaStartHeight + 30 + (actIndex * 30);
                                
                                const activityItrbs = itrbsByActivityId[actividad.id] || [];
                                
                                return (
                                  <React.Fragment key={actividad.id}>
                                    <div 
                                      className="relative h-7 mb-1"
                                      style={{ top: `${actStartHeight}px` }}
                                    >
                                      <div className="absolute left-0 w-48 truncate pl-8 text-sm font-medium dark:text-gray-300">
                                        {actividad.nombre}
                                        <span className="text-xs text-gray-500 ml-1">
                                          ({activityItrbs.length} ITR)
                                        </span>
                                      </div>
                                      
                                      <GanttBar
                                        start={new Date(actividad.fechaInicio)}
                                        end={new Date(actividad.fechaFin)}
                                        color="#64748b"
                                        label={actividad.nombre}
                                        ganttStart={startDate}
                                        ganttEnd={endDate}
                                        height={0}
                                      />
                                    </div>
                                    
                                    {activityItrbs.map((itrb, itrbIndex) => {
                                      const itrbStartHeight = actStartHeight + 30 + (itrbIndex * 25);
                                      
                                      const actStart = new Date(actividad.fechaInicio);
                                      const actEnd = new Date(actividad.fechaFin);
                                      const itrbEnd = new Date(itrb.fechaLimite);
                                      
                                      const effectiveEnd = itrbEnd < actStart ? actStart : itrbEnd;
                                      
                                      return (
                                        <div 
                                          key={itrb.id} 
                                          className="relative h-6 ml-12"
                                          style={{ top: `${itrbStartHeight}px` }}
                                        >
                                          <div className="absolute left-0 w-36 truncate pl-8 text-xs text-gray-600 dark:text-gray-400">
                                            {itrb.descripcion.substring(0, 20)}{itrb.descripcion.length > 20 ? '...' : ''}
                                          </div>
                                          
                                          <GanttBar
                                            start={actStart}
                                            end={effectiveEnd}
                                            color={getColorByEstado(itrb.estado)}
                                            label={`${itrb.descripcion} (${itrb.cantidadRealizada}/${itrb.cantidadTotal})`}
                                            ganttStart={startDate}
                                            ganttEnd={endDate}
                                            height={0}
                                          />
                                        </div>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      
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
    </ScrollArea>
  );
};

export default GanttChart;
