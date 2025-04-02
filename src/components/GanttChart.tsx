
import React, { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Actividad, ITRB } from "@/types";

interface GanttBarProps {
  start: Date;
  end: Date;
  color: string;
  label: string;
  ganttStart: Date;
  ganttEnd: Date;
  height: number;
}

// Componente para una barra individual en el gráfico Gantt
const GanttBar: React.FC<GanttBarProps> = ({ 
  start, end, color, label, ganttStart, ganttEnd, height 
}) => {
  // Calcular posición y ancho de la barra
  const totalDuration = ganttEnd.getTime() - ganttStart.getTime();
  const startOffset = Math.max(0, start.getTime() - ganttStart.getTime());
  const duration = end.getTime() - start.getTime();
  
  const left = (startOffset / totalDuration) * 100;
  const width = (duration / totalDuration) * 100;
  
  return (
    <div 
      className="absolute h-6 rounded-sm text-xs text-white overflow-hidden whitespace-nowrap"
      style={{ 
        left: `${left}%`, 
        width: `${width}%`,
        top: `${height}px`,
        backgroundColor: color,
      }}
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
    <div className="absolute inset-0 border-b">
      {months.map((date, index) => {
        const offset = (date.getTime() - startDate.getTime()) / totalDuration * 100;
        return (
          <div key={index} className="absolute top-0 bottom-0 border-l border-gray-300"
               style={{ left: `${offset}%` }}>
            <div className="absolute -top-7 -left-10 w-20 text-center text-xs text-gray-500">
              {date.toLocaleDateString("es-ES", { month: 'short', year: 'numeric' })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Componente principal del Gantt
const GanttChart: React.FC = () => {
  const { actividades, itrbItems } = useAppContext();
  
  // Organizar datos por sistema y subsistema
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, { 
      actividades: Actividad[], 
      itrbs: ITRB[]
    }>> = {};
    
    // Añadir actividades a grupos
    actividades.forEach(actividad => {
      const { sistema, subsistema } = actividad;
      
      if (!result[sistema]) {
        result[sistema] = {};
      }
      
      if (!result[sistema][subsistema]) {
        result[sistema][subsistema] = { actividades: [], itrbs: [] };
      }
      
      result[sistema][subsistema].actividades.push(actividad);
    });
    
    // Añadir ITRBs a grupos
    itrbItems.forEach(itrb => {
      const actividad = actividades.find(a => a.id === itrb.actividadId);
      if (actividad) {
        const { sistema, subsistema } = actividad;
        if (result[sistema] && result[sistema][subsistema]) {
          result[sistema][subsistema].itrbs.push(itrb);
        }
      }
    });
    
    return result;
  }, [actividades, itrbItems]);
  
  // Determinar fechas límites del Gantt
  const { startDate, endDate } = useMemo(() => {
    let earliest = new Date();
    let latest = new Date();
    
    if (actividades.length > 0) {
      earliest = new Date(actividades.reduce(
        (min, act) => act.fechaInicio < min ? act.fechaInicio : min,
        actividades[0].fechaInicio
      ));
      
      latest = new Date(actividades.reduce(
        (max, act) => act.fechaFin > max ? act.fechaFin : max,
        actividades[0].fechaFin
      ));
      
      // Añadir un margen de días antes y después
      earliest.setDate(earliest.getDate() - 5);
      latest.setDate(latest.getDate() + 5);
    }
    
    return { startDate: earliest, endDate: latest };
  }, [actividades]);
  
  // Colores para los estados
  const getColorByEstado = (estado: string) => {
    switch (estado) {
      case "Completado": return "bg-estado-completado";
      case "En curso": return "bg-estado-curso";
      case "Vencido": return "bg-estado-vencido";
      default: return "bg-gray-500";
    }
  };
  
  // Calcular altura total del Gantt
  const calculateTotalHeight = () => {
    let height = 0;
    
    Object.keys(groupedData).forEach(sistema => {
      height += 40; // Altura del encabezado del sistema
      
      Object.keys(groupedData[sistema]).forEach(subsistema => {
        height += 30; // Altura del encabezado del subsistema
        
        const { actividades, itrbs } = groupedData[sistema][subsistema];
        height += actividades.length * 30; // Altura de cada actividad
        height += itrbs.length * 25; // Altura de cada ITRB
      });
    });
    
    return Math.max(height, 200); // Altura mínima de 200px
  };
  
  if (actividades.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
        Agregue actividades para visualizar el gráfico Gantt
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">
        Gráfico Gantt de Actividades e ITR B
      </h2>
      
      <div className="w-full overflow-x-auto">
        <div className="relative min-w-[800px]" style={{ height: `${calculateTotalHeight()}px` }}>
          {/* Grid de tiempo */}
          <div className="h-7 mb-2 relative">
            <TimeGrid startDate={startDate} endDate={endDate} />
          </div>
          
          {/* Contenido del Gantt */}
          <div className="relative" style={{ height: `${calculateTotalHeight() - 30}px` }}>
            {Object.entries(groupedData).map(([sistema, subsistemas], sistemaIndex) => {
              let currentHeight = sistemaIndex === 0 ? 0 : 40 * sistemaIndex;
              
              // Calcular altura para todos los subsistemas anteriores
              if (sistemaIndex > 0) {
                Object.keys(groupedData).slice(0, sistemaIndex).forEach(prevSistema => {
                  Object.keys(groupedData[prevSistema]).forEach(prevSubsistema => {
                    const { actividades, itrbs } = groupedData[prevSistema][prevSubsistema];
                    currentHeight += 30; // Encabezado de subsistema
                    currentHeight += actividades.length * 30;
                    currentHeight += itrbs.length * 25;
                  });
                });
              }
              
              return (
                <React.Fragment key={sistema}>
                  {/* Encabezado del Sistema */}
                  <div 
                    className="sticky left-0 font-bold bg-oilgas-primary text-white p-2 rounded-sm mb-1"
                    style={{ top: `${currentHeight}px` }}
                  >
                    {sistema}
                  </div>
                  
                  {Object.entries(subsistemas).map(([subsistema, { actividades: acts, itrbs }], subsistemaIndex) => {
                    // Actualizar altura para este subsistema
                    currentHeight += 40; // Altura del encabezado del sistema + espacio
                    
                    // Añadir altura de subsistemas anteriores en este sistema
                    if (subsistemaIndex > 0) {
                      Object.entries(subsistemas).slice(0, subsistemaIndex).forEach(
                        ([_, { actividades: prevActs, itrbs: prevItrbs }]) => {
                          currentHeight += 30; // Encabezado de subsistema
                          currentHeight += prevActs.length * 30;
                          currentHeight += prevItrbs.length * 25;
                        }
                      );
                    }
                    
                    const subsistemaStartHeight = currentHeight;
                    
                    return (
                      <React.Fragment key={`${sistema}-${subsistema}`}>
                        {/* Encabezado del Subsistema */}
                        <div 
                          className="sticky left-0 font-semibold bg-oilgas-secondary text-white p-1 pl-4 rounded-sm mb-1"
                          style={{ top: `${subsistemaStartHeight}px` }}
                        >
                          {subsistema}
                        </div>
                        
                        {/* Actividades */}
                        {acts.map((actividad, actIndex) => {
                          const actStartHeight = subsistemaStartHeight + 30 + (actIndex * 30);
                          
                          return (
                            <div 
                              key={actividad.id} 
                              className="relative h-7 mb-1"
                              style={{ top: `${actStartHeight}px` }}
                            >
                              <div className="absolute left-0 w-48 truncate pl-6 text-sm font-medium">
                                {actividad.nombre}
                              </div>
                              
                              <GanttBar
                                start={new Date(actividad.fechaInicio)}
                                end={new Date(actividad.fechaFin)}
                                color="#64748b" // Color gris para actividades
                                label={actividad.nombre}
                                ganttStart={startDate}
                                ganttEnd={endDate}
                                height={0}
                              />
                            </div>
                          );
                        })}
                        
                        {/* ITR B asociados */}
                        {itrbs.map((itrb, itrbIndex) => {
                          const relatedActivity = acts.find(a => a.id === itrb.actividadId);
                          if (!relatedActivity) return null;
                          
                          const itrbStartHeight = subsistemaStartHeight + 30 + (acts.length * 30) + (itrbIndex * 25);
                          
                          // Fechas para el ITRB
                          const actStart = new Date(relatedActivity.fechaInicio);
                          const actEnd = new Date(relatedActivity.fechaFin);
                          const itrbEnd = new Date(itrb.fechaLimite);
                          
                          // Asegurarnos que la fecha límite del ITRB no sea anterior a la fecha de inicio de la actividad
                          const effectiveEnd = itrbEnd < actStart ? actStart : itrbEnd;
                          
                          return (
                            <div 
                              key={itrb.id} 
                              className="relative h-6 ml-12"
                              style={{ top: `${itrbStartHeight}px` }}
                            >
                              <div className="absolute left-0 w-36 truncate pl-6 text-xs text-gray-600">
                                {itrb.descripcion.substring(0, 20)}{itrb.descripcion.length > 20 ? '...' : ''}
                              </div>
                              
                              <GanttBar
                                start={actStart}
                                end={effectiveEnd}
                                color={getColorByEstado(itrb.estado).replace('bg-', '#')}
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
          </div>
        </div>
      </div>
      
      {/* Leyenda de colores */}
      <div className="flex justify-center mt-4 space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-estado-completado rounded mr-2"></div>
          <span className="text-sm">Completado</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-estado-curso rounded mr-2"></div>
          <span className="text-sm">En curso</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-estado-vencido rounded mr-2"></div>
          <span className="text-sm">Vencido</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
          <span className="text-sm">Actividad</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
