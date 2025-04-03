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
  tamanoGrafico?: "pequeno" | "mediano" | "grande" | "completo";
}

const GanttBarChart: React.FC<GanttBarChartProps> = ({
  data,
  currentStartDate,
  currentEndDate,
  zoomLevel,
  viewMode,
  mostrarSubsistemas,
  mostrarLeyenda = true,
  tamanoGrafico = "mediano"
}) => {
  const [hoveredItem, setHoveredItem] = useState<GanttData | null>(null);
  const [hoveredItrb, setHoveredItrb] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getAlturaFila = (tamano: "pequeno" | "mediano" | "grande" | "completo") => {
    switch (tamano) {
      case "pequeno": return "h-6";
      case "mediano": return "h-8";
      case "grande": return "h-10";
      case "completo": return "h-12";
      default: return "h-8";
    }
  };

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
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

  const axisDates = useMemo(() => {
    return getAxisDates(currentStartDate, currentEndDate, viewMode);
  }, [currentStartDate, currentEndDate, viewMode]);

  const isDateInRange = (date: Date) => {
    return isWithinInterval(date, { start: currentStartDate, end: currentEndDate });
  };

  const calculatePosition = (date: Date): number => {
    const totalDuration = currentEndDate.getTime() - currentStartDate.getTime();
    const timeFromStart = date.getTime() - currentStartDate.getTime();
    return (timeFromStart / totalDuration) * 100;
  };

  const handleMouseOver = (event: React.MouseEvent, item: GanttData) => {
    setHoveredItem(item);
    setHoveredItrb(null);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleItrbMouseOver = (event: React.MouseEvent, itrb: any) => {
    setHoveredItrb(itrb);
    setHoveredItem(null);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    event.stopPropagation();
  };

  const handleMouseOut = () => {
    setHoveredItem(null);
    setHoveredItrb(null);
  };

  const getSpacingClass = () => {
    switch (tamanoGrafico) {
      case "pequeno": return "space-y-1";
      case "mediano": return "space-y-2";
      case "grande": return "space-y-3";
      case "completo": return "space-y-4";
      default: return "space-y-2";
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <ScrollArea className="w-full">
          <div className="min-w-[800px] relative">
            <GanttDateHeaders axisDates={axisDates} viewMode={viewMode} isDarkMode={isDarkMode} />
            <GanttTodayIndicator currentStartDate={currentStartDate} currentEndDate={currentEndDate} calculatePosition={calculatePosition} />
            <div className={`w-full ${getSpacingClass()} ${getAlturaFila(tamanoGrafico)}`}>
              {Object.entries(groupedData).map(([proyecto, sistemas], proyectoIndex) => (
                <React.Fragment key={`proyecto-${proyectoIndex}`}>
                  <GanttProjectHeader proyecto={proyecto} axisDates={axisDates} isDarkMode={isDarkMode} />
                  {Object.entries(sistemas).map(([sistema, subsistemas], sistemaIndex) => (
                    <React.Fragment key={`sistema-${proyectoIndex}-${sistemaIndex}`}>
                      <GanttSystemHeader sistema={sistema} axisDates={axisDates} isDarkMode={isDarkMode} />
                      {mostrarSubsistemas && subsistemas.map((subsistema, subsistemaIndex) => (
                        <React.Fragment key={`subsistema-${proyectoIndex}-${sistemaIndex}-${subsistemaIndex}`}>
                          <GanttSubsystemHeader subsistema={subsistema} axisDates={axisDates} isDarkMode={isDarkMode} />
                          {data
                            .filter(item => item.proyecto === proyecto && item.sistema === sistema && item.subsistema === subsistema)
                            .map((item, itemIndex) => (
                              <GanttActivityBar key={`activity-${item.id}`} item={item} axisDates={axisDates} isDarkMode={isDarkMode} itemIndex={itemIndex} calculatePosition={calculatePosition} handleMouseOver={handleMouseOver} handleItrbMouseOver={handleItrbMouseOver} handleMouseOut={handleMouseOut} isDateInRange={isDateInRange} withSubsystem={true} tamanoGrafico={tamanoGrafico} />
                            ))}
                        </React.Fragment>
                      ))}
                      {!mostrarSubsistemas && (
                        <>
                          {data
                            .filter(item => item.proyecto === proyecto && item.sistema === sistema)
                            .map((item, itemIndex) => (
                              <GanttActivityBar key={`activity-direct-${item.id}`} item={item} axisDates={axisDates} isDarkMode={isDarkMode} itemIndex={itemIndex} calculatePosition={calculatePosition} handleMouseOver={handleMouseOver} handleItrbMouseOver={handleItrbMouseOver} handleMouseOut={handleMouseOut} isDateInRange={isDateInRange} withSubsystem={false} tamanoGrafico={tamanoGrafico} />
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
      </div>
      {hoveredItem && <GanttTooltip item={hoveredItem} position={tooltipPosition} />}
      {hoveredItrb && <GanttItrbTooltip hoveredItrb={hoveredItrb} tooltipPosition={tooltipPosition} />}
      <GanttLegend mostrarLeyenda={mostrarLeyenda} />
    </div>
  );
};

export default GanttBarChart;

