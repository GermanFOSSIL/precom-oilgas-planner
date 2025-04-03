
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { addDays, addWeeks, addMonths, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

// Import our refactored components
import GanttLoadingState from "./gantt/GanttLoadingState";
import GanttEmptyState from "./gantt/GanttEmptyState";
import GanttNavigationControls from "./gantt/GanttNavigationControls";
import GanttBarChart from "./gantt/GanttBarChart";
import { useGanttData } from "./gantt/hooks/useGanttData";
import { calculateNewDateRange } from "./gantt/utils/dateUtils";

interface GanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const GanttChart: React.FC<GanttChartProps> = ({ 
  filtros, 
  configuracion 
}) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  
  // Initialize view based on current date
  const today = new Date();
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
    switch (viewMode) {
      case "day":
        return startOfDay(today);
      case "week":
        return startOfWeek(today, { locale: es });
      case "month":
      default:
        return startOfMonth(today);
    }
  });
  
  const [currentEndDate, setCurrentEndDate] = useState<Date>(() => {
    switch (viewMode) {
      case "day":
        return addDays(currentStartDate, 1);
      case "week":
        return addDays(currentStartDate, 7);
      case "month":
      default:
        return addMonths(currentStartDate, 1);
    }
  });
  
  const mostrarSubsistemas = configuracion.mostrarSubsistemas !== undefined 
    ? configuracion.mostrarSubsistemas 
    : true;

  // Get filtered and processed data from custom hook
  const { ganttData } = useGanttData(actividades, itrbItems, proyectos, filtros);

  // Simulate loading for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle zoom level changes
  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
  };

  // Handle view mode changes
  const handleViewModeChange = (newMode: "month" | "week" | "day") => {
    setViewMode(newMode);
    
    // Update date range based on new view mode
    const { newStartDate, newEndDate } = calculateNewDateRange(
      currentStartDate,
      currentEndDate,
      "today", // Reset to today when changing view mode
      newMode
    );
    
    setCurrentStartDate(newStartDate);
    setCurrentEndDate(newEndDate);
  };

  // Handle time navigation
  const navigateTime = (direction: "prev" | "next" | "today") => {
    const { newStartDate, newEndDate } = calculateNewDateRange(
      currentStartDate,
      currentEndDate,
      direction,
      viewMode
    );
    
    setCurrentStartDate(newStartDate);
    setCurrentEndDate(newEndDate);
  };

  if (loading) {
    return <GanttLoadingState />;
  }

  if (ganttData.length === 0) {
    return <GanttEmptyState />;
  }

  return (
    <div className="w-full h-full flex flex-col gantt-chart-container">
      <GanttNavigationControls
        currentStartDate={currentStartDate}
        currentEndDate={currentEndDate}
        viewMode={viewMode}
        zoomLevel={zoomLevel}
        onNavigate={navigateTime}
        onViewModeChange={handleViewModeChange}
        onZoomChange={changeZoom}
      />
      
      <div className="overflow-y-auto max-h-[70vh]">
        <GanttBarChart
          data={ganttData}
          currentStartDate={currentStartDate}
          currentEndDate={currentEndDate}
          zoomLevel={zoomLevel}
          viewMode={viewMode}
          mostrarSubsistemas={mostrarSubsistemas}
          mostrarLeyenda={configuracion.mostrarLeyenda}
          tamanoGrafico={configuracion.tamano}
        />
      </div>
    </div>
  );
};

export default GanttChart;
