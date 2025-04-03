
import React, { useState, useEffect, useMemo } from "react";
import { isWithinInterval } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAxisDates } from "./utils/dateUtils";
import GanttTooltip from "./GanttTooltip";
import GanttItrbTooltip from "./GanttItrbTooltip";
import GanttDateHeaders from "./GanttDateHeaders";
import GanttProjectHeader from "./GanttProjectHeader";
import GanttSystemHeader from "./GanttSystemHeader";
import GanttSubsystemHeader from "./GanttSubsystemHeader";
import GanttActivityBar from "./GanttActivityBar";
import GanttTodayIndicator from "./GanttTodayIndicator";
import GanttLegend from "./GanttLegend";

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

  return (
    <div className="w-full h-full flex flex-col">
      <ScrollArea className="w-full h-full">
        <div className="min-w-[800px] relative">
          {/* Date Headers */}
          <GanttDateHeaders 
            axisDates={axisDates}
            viewMode={viewMode}
            isDarkMode={isDarkMode}
          />

          {/* Today indicator */}
          <GanttTodayIndicator 
            currentStartDate={currentStartDate}
            currentEndDate={currentEndDate}
            calculatePosition={calculatePosition}
          />

          {/* Gantt Content */}
          <div className="w-full">
            {Object.entries(groupedData).map(([proyecto, sistemas], proyectoIndex) => (
              <React.Fragment key={`proyecto-${proyectoIndex}`}>
                {/* Project Header */}
                <GanttProjectHeader 
                  proyecto={proyecto}
                  axisDates={axisDates}
                  isDarkMode={isDarkMode}
                />

                {Object.entries(sistemas).map(([sistema, subsistemas], sistemaIndex) => (
                  <React.Fragment key={`sistema-${proyectoIndex}-${sistemaIndex}`}>
                    {/* System Header */}
                    <GanttSystemHeader
                      sistema={sistema}
                      axisDates={axisDates}
                      isDarkMode={isDarkMode}
                    />

                    {mostrarSubsistemas && subsistemas.map((subsistema, subsistemaIndex) => (
                      <React.Fragment key={`subsistema-${proyectoIndex}-${sistemaIndex}-${subsistemaIndex}`}>
                        {/* Subsystem Header */}
                        <GanttSubsystemHeader
                          subsistema={subsistema}
                          axisDates={axisDates}
                          isDarkMode={isDarkMode}
                        />

                        {/* Activities for this subsystem */}
                        {data
                          .filter(item => item.proyecto === proyecto && item.sistema === sistema && item.subsistema === subsistema)
                          .map((item, itemIndex) => (
                            <GanttActivityBar
                              key={`activity-${item.id}`}
                              item={item}
                              axisDates={axisDates}
                              isDarkMode={isDarkMode}
                              itemIndex={itemIndex}
                              calculatePosition={calculatePosition}
                              handleMouseOver={handleMouseOver}
                              handleItrbMouseOver={handleItrbMouseOver}
                              handleMouseOut={handleMouseOut}
                              isDateInRange={isDateInRange}
                              withSubsystem={true}
                            />
                          ))}
                      </React.Fragment>
                    ))}

                    {/* If subsystems are hidden, show activities directly under system */}
                    {!mostrarSubsistemas && (
                      <>
                        {data
                          .filter(item => item.proyecto === proyecto && item.sistema === sistema)
                          .map((item, itemIndex) => (
                            <GanttActivityBar
                              key={`activity-direct-${item.id}`}
                              item={item}
                              axisDates={axisDates}
                              isDarkMode={isDarkMode}
                              itemIndex={itemIndex}
                              calculatePosition={calculatePosition}
                              handleMouseOver={handleMouseOver}
                              handleItrbMouseOver={handleItrbMouseOver}
                              handleMouseOut={handleMouseOut}
                              isDateInRange={isDateInRange}
                              withSubsystem={false}
                            />
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
        <GanttItrbTooltip
          hoveredItrb={hoveredItrb}
          tooltipPosition={tooltipPosition}
        />
      )}

      {/* Legend */}
      <GanttLegend mostrarLeyenda={mostrarLeyenda} />
    </div>
  );
};

export default GanttBarChart;
