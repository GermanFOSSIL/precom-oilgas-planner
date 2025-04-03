
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { addDays } from "date-fns";

// Import our refactored components
import GanttLoadingState from "./gantt/GanttLoadingState";
import GanttEmptyState from "./gantt/GanttEmptyState";
import GanttNavigationControls from "./gantt/GanttNavigationControls";
import GanttBarChart from "./gantt/GanttBarChart";
import { useGanttData } from "./gantt/hooks/useGanttData";
import { calculateNewDateRange } from "./gantt/utils/dateUtils";

interface EnhancedGanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({ 
  filtros, 
  configuracion 
}) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date());
  const [currentEndDate, setCurrentEndDate] = useState<Date>(addDays(new Date(), 30));
  
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

  // Setup event listeners for export
  useEffect(() => {
    const exportPDFHandler = () => {
      // Handle export when event is triggered from elsewhere in the app
      console.log("Export PDF event captured in EnhancedGanttChart");
      // Implementación futura si es necesario
    };
    
    const exportExcelHandler = () => {
      // Handle export when event is triggered from elsewhere in the app
      console.log("Export Excel event captured in EnhancedGanttChart");
      // Implementación futura si es necesario
    };
    
    window.addEventListener('export-gantt-pdf', exportPDFHandler);
    window.addEventListener('export-gantt-excel', exportExcelHandler);
    
    return () => {
      window.removeEventListener('export-gantt-pdf', exportPDFHandler);
      window.removeEventListener('export-gantt-excel', exportExcelHandler);
    };
  }, []);

  // Handle zoom level changes
  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
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

  // Handle view mode changes
  const handleViewModeChange = (newMode: "month" | "week" | "day") => {
    setViewMode(newMode);
    
    // Adjust date range based on new view mode
    let newStartDate = new Date(currentStartDate);
    let duration;
    
    switch (newMode) {
      case "day":
        duration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        break;
      case "week":
        duration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        break;
      case "month":
      default:
        duration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        break;
    }
    
    const newEndDate = new Date(newStartDate.getTime() + duration);
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
      
      <GanttBarChart
        data={ganttData}
        currentStartDate={currentStartDate}
        currentEndDate={currentEndDate}
        zoomLevel={zoomLevel}
        viewMode={viewMode}
        mostrarSubsistemas={mostrarSubsistemas}
        mostrarLeyenda={configuracion.mostrarLeyenda}
      />
    </div>
  );
};

export default EnhancedGanttChart;
