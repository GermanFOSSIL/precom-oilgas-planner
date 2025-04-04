import React, { useState } from "react";
import "./styles/EnhancedGantt.css";
import { format, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import GanttDateHeaders from "./GanttDateHeaders";
import GanttProjectHeader from "./GanttProjectHeader";
import GanttSystemHeader from "./GanttSystemHeader";
import GanttSubsystemHeader from "./GanttSubsystemHeader";
import GanttActivityBar from "./GanttActivityBar";
import GanttTodayIndicator from "./GanttTodayIndicator";
import GanttLegend from "./GanttLegend";
import GanttTooltip from "./GanttTooltip";
import GanttItrbTooltip from "./GanttItrbTooltip";
import { useAppContext } from "@/context/AppContext";

interface GanttBarChartProps {
  data: any[];
  currentStartDate: Date;
  currentEndDate: Date;
  zoomLevel: number;
  viewMode: "month" | "week" | "day";
  mostrarSubsistemas: boolean;
  mostrarLeyenda: boolean | undefined;
  tamanoGrafico: "pequeno" | "mediano" | "grande" | "completo";
}

const GanttBarChart: React.FC<GanttBarChartProps> = ({
  data,
  currentStartDate,
  currentEndDate,
  zoomLevel,
  viewMode,
  mostrarSubsistemas,
  mostrarLeyenda,
  tamanoGrafico
}) => {
  const { theme } = useAppContext();
  const isDarkMode = theme.mode === "dark";
  
  const axisDates: Date[] = [];
  const currentDate = new Date(currentStartDate);
  
  while (currentDate <= currentEndDate) {
    axisDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    type: "actividad" | "itrb" | null;
    data: any;
    position: { x: number; y: number };
  }>({
    visible: false,
    type: null,
    data: null,
    position: { x: 0, y: 0 },
  });
  
  const showTooltip = (
    event: React.MouseEvent,
    data: any,
    type: "actividad" | "itrb"
  ) => {
    const x = event.clientX;
    const y = event.clientY;
    
    setTooltipInfo({
      visible: true,
      type,
      data,
      position: { x, y },
    });
  };
  
  const hideTooltip = () => {
    setTooltipInfo({
      ...tooltipInfo,
      visible: false,
    });
  };

  const getItemPosition = (startDate: string | Date, endDate: string | Date, width: number) => {
    let start;
    let end;
    
    try {
      start = startDate instanceof Date ? startDate : new Date(startDate);
      end = endDate instanceof Date ? endDate : new Date(endDate);
      
      if (isNaN(start.getTime())) {
        start = currentStartDate;
      }
      if (isNaN(end.getTime())) {
        end = new Date(currentStartDate);
        end.setDate(end.getDate() + 7);
      }
    } catch (error) {
      console.error("Error en fechas del gráfico Gantt:", error);
      start = currentStartDate;
      end = new Date(currentStartDate);
      end.setDate(end.getDate() + 7);
    }
    
    if (start > currentEndDate || end < currentStartDate) {
      return null;
    }
    
    const startVisible = start < currentStartDate ? currentStartDate : start;
    const endVisible = end > currentEndDate ? currentEndDate : end;
    
    const totalDays = axisDates.length;
    
    const startDayIndex = axisDates.findIndex(
      (d) => d.toDateString() === startVisible.toDateString()
    );
    
    let endDayIndex = axisDates.findIndex(
      (d) => d.toDateString() === endVisible.toDateString()
    );
    
    if (endDayIndex === -1) endDayIndex = totalDays - 1;
    if (startDayIndex === -1) return null;
    
    const left = (startDayIndex * width) / zoomLevel;
    const barWidth = ((endDayIndex - startDayIndex + 1) * width) / zoomLevel;
    
    return { left, width: barWidth };
  };
  
  const getCellWidth = () => {
    switch (viewMode) {
      case "day": return 80 / zoomLevel;
      case "week": return 40 / zoomLevel;
      case "month": default: return 30 / zoomLevel;
    }
  };
  
  const cellWidth = getCellWidth();
  
  const getGridTemplateColumns = () => {
    return `minmax(280px, auto) repeat(${axisDates.length}, ${cellWidth}px)`;
  };
  
  return (
    <div className="gantt-container">
      <div className="gantt-grid" style={{ gridTemplateColumns: getGridTemplateColumns() }}>
        <GanttDateHeaders 
          axisDates={axisDates} 
          viewMode={viewMode}
          isDarkMode={isDarkMode}
        />
        
        <GanttTodayIndicator 
          currentStartDate={currentStartDate}
          currentEndDate={currentEndDate}
          calculatePosition={(date) => {
            const totalDays = axisDates.length;
            const dayIndex = axisDates.findIndex(d => d.toDateString() === date.toDateString());
            if (dayIndex === -1) return 0;
            return (dayIndex * 100) / totalDays;
          }}
        />
        
        {data.map((proyecto) => (
          <React.Fragment key={proyecto.id}>
            <GanttProjectHeader 
              proyecto={proyecto.nombre} 
              axisDates={axisDates}
              isDarkMode={isDarkMode}
            />
            
            {proyecto.sistemas.map((sistema) => (
              <React.Fragment key={`${proyecto.id}-${sistema.nombre}`}>
                <GanttSystemHeader 
                  sistema={sistema.nombre} 
                  axisDates={axisDates}
                  isDarkMode={isDarkMode}
                />
                
                {mostrarSubsistemas && sistema.subsistemas.map((subsistema) => (
                  <React.Fragment key={`${proyecto.id}-${sistema.nombre}-${subsistema.nombre}`}>
                    <GanttSubsystemHeader 
                      subsistema={subsistema.nombre}
                      axisDates={axisDates}
                      isDarkMode={isDarkMode}
                    />
                    
                    {subsistema.actividades.map((actividad) => {
                      const fechaInicio = new Date(actividad.fechaInicio);
                      const fechaFin = new Date(actividad.fechaFin);
                      
                      const activityPosition = getItemPosition(
                        isNaN(fechaInicio.getTime()) ? new Date() : fechaInicio,
                        isNaN(fechaFin.getTime()) ? new Date(new Date().setDate(new Date().getDate() + 7)) : fechaFin,
                        cellWidth
                      );

                      if (!activityPosition) return null;

                      const getColorShade = (str: string) => {
                        let hash = 0;
                        for (let i = 0; i < str.length; i++) {
                          hash = str.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const hue = hash % 360;
                        return `hsl(${hue}, 70%, ${isDarkMode ? '40%' : '65%'})`;
                      };

                      const activityColor = getColorShade(`${sistema.nombre}-${subsistema.nombre}`);
                      const activityBorderColor = getColorShade(`${sistema.nombre}-${subsistema.nombre}-border`);

                      return (
                        <div 
                          key={actividad.id} 
                          className="gantt-row activity-row"
                        >
                          <div className="gantt-label activity-label">
                            <span className="truncate">{actividad.nombre}</span>
                          </div>
                          
                          <div 
                            className="gantt-activity-bar"
                            style={{
                              left: `${activityPosition.left}px`,
                              width: `${activityPosition.width}px`,
                              backgroundColor: activityColor,
                              borderColor: activityBorderColor,
                            }}
                            onMouseEnter={(e) => showTooltip(e, actividad, "actividad")}
                            onMouseLeave={hideTooltip}
                          >
                            {activityPosition.width > 50 && (
                              <span className="gantt-bar-label">{actividad.nombre}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {subsistema.itrbs?.map((itrb) => {
                      const actividad = subsistema.actividades.find(
                        (act) => act.id === itrb.actividadId
                      );
                      
                      if (!actividad) return null;
                      
                      let fechaInicio;
                      let fechaLimite;
                      
                      try {
                        fechaInicio = itrb.fechaInicio 
                          ? new Date(itrb.fechaInicio) 
                          : (actividad.fechaInicio ? new Date(actividad.fechaInicio) : new Date());
                          
                        fechaLimite = new Date(itrb.fechaLimite);
                        
                        if (isNaN(fechaInicio.getTime())) fechaInicio = new Date();
                        if (isNaN(fechaLimite.getTime())) {
                          fechaLimite = new Date();
                          fechaLimite.setDate(fechaLimite.getDate() + 7);
                        }
                      } catch (error) {
                        console.error("Error en fechas de ITRB:", error);
                        fechaInicio = new Date();
                        fechaLimite = new Date();
                        fechaLimite.setDate(fechaLimite.getDate() + 7);
                      }
                      
                      const itrbPosition = getItemPosition(
                        fechaInicio,
                        fechaLimite,
                        cellWidth
                      );
                      
                      if (!itrbPosition) return null;
                      
                      const getItrColor = (estado: string) => {
                        switch (estado) {
                          case "Completado": return { bg: isDarkMode ? "#22c55e" : "#4ade80", border: "#16a34a" };
                          case "En curso": return { bg: isDarkMode ? "#f59e0b" : "#fbbf24", border: "#d97706" };
                          case "Vencido": return { bg: isDarkMode ? "#ef4444" : "#f87171", border: "#dc2626" };
                          default: return { bg: isDarkMode ? "#94a3b8" : "#cbd5e1", border: "#64748b" };
                        }
                      };
                      
                      const colors = getItrColor(itrb.estado);

                      return (
                        <div 
                          key={itrb.id} 
                          className="gantt-row itrb-row"
                        >
                          <div className="gantt-label itrb-label">
                            <span className="truncate">{itrb.descripcion}</span>
                          </div>
                          
                          <div 
                            className="gantt-itrb-bar"
                            style={{
                              left: `${itrbPosition.left}px`,
                              width: `${itrbPosition.width}px`,
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                            }}
                            onMouseEnter={(e) => showTooltip(e, itrb, "itrb")}
                            onMouseLeave={hideTooltip}
                          >
                            {itrbPosition.width > 50 && (
                              <span className="gantt-bar-label">
                                {itrb.descripcion} ({itrb.cantidadRealizada}/{itrb.cantidadTotal})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
                
                {!mostrarSubsistemas && sistema.actividades?.map((actividad) => {
                  const fechaInicio = new Date(actividad.fechaInicio);
                  const fechaFin = new Date(actividad.fechaFin);
                  
                  const activityPosition = getItemPosition(
                    isNaN(fechaInicio.getTime()) ? new Date() : fechaInicio,
                    isNaN(fechaFin.getTime()) ? new Date(new Date().setDate(new Date().getDate() + 7)) : fechaFin,
                    cellWidth
                  );
                  
                  if (!activityPosition) return null;
                  
                  return (
                    <div 
                      key={actividad.id} 
                      className="gantt-row activity-row"
                    >
                      <div className="gantt-label activity-label">
                        <span className="truncate">{actividad.nombre}</span>
                      </div>
                      
                      <div 
                        className="gantt-activity-bar"
                        style={{
                          left: `${activityPosition.left}px`,
                          width: `${activityPosition.width}px`,
                        }}
                        onMouseEnter={(e) => showTooltip(e, actividad, "actividad")}
                        onMouseLeave={hideTooltip}
                      >
                        {activityPosition.width > 50 && (
                          <span className="gantt-bar-label">{actividad.nombre}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {mostrarLeyenda && <GanttLegend mostrarLeyenda={mostrarLeyenda} />}
      
      {tooltipInfo.visible && tooltipInfo.type === "actividad" && (
        <GanttTooltip 
          item={tooltipInfo.data} 
          position={tooltipInfo.position}
        />
      )}
      
      {tooltipInfo.visible && tooltipInfo.type === "itrb" && (
        <GanttItrbTooltip 
          hoveredItrb={tooltipInfo.data} 
          tooltipPosition={tooltipInfo.position}
        />
      )}
    </div>
  );
};

export default GanttBarChart;
