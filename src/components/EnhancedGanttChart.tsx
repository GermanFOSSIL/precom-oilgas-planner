
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
import { generateSampleData, processDataForGantt } from "./gantt/utils/sampleData";

interface EnhancedGanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({ 
  filtros, 
  configuracion 
}) => {
  const { actividades: appActividades, itrbItems: appItrbItems, proyectos: appProyectos } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date());
  const [currentEndDate, setCurrentEndDate] = useState<Date>(addDays(new Date(), 30));
  const [usingSampleData, setUsingSampleData] = useState<boolean>(false);
  
  // Demo data for testing
  const [sampleData, setSampleData] = useState<{
    actividades: any[];
    itrbItems: any[];
    proyectos: any[];
  }>({ actividades: [], itrbItems: [], proyectos: [] });
  
  // Generate sample data once
  useEffect(() => {
    setSampleData(generateSampleData());
  }, []);
  
  // Determine which data source to use
  const actividades = usingSampleData ? sampleData.actividades : appActividades;
  const itrbItems = usingSampleData ? sampleData.itrbItems : appItrbItems;
  const proyectos = usingSampleData ? sampleData.proyectos : appProyectos;
  
  const mostrarSubsistemas = configuracion.mostrarSubsistemas !== undefined 
    ? configuracion.mostrarSubsistemas 
    : true;

  // Get filtered and processed data
  const { ganttData } = useGanttData(actividades, itrbItems, proyectos, filtros);

  // Toggle sample data
  const toggleSampleData = useCallback(() => {
    setUsingSampleData(prev => !prev);
  }, []);

  // Simulate loading for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [usingSampleData]);

  // Setup event listeners for export
  useEffect(() => {
    const exportPDFHandler = () => {
      // Handle export when event is triggered from elsewhere in the app
      console.log("Export PDF event captured in EnhancedGanttChart");
      // Future implementation if needed
    };
    
    const exportExcelHandler = () => {
      // Handle export when event is triggered from elsewhere in the app
      console.log("Export Excel event captured in EnhancedGanttChart");
      // Future implementation if needed
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

  // Show loading state
  if (loading) {
    return <GanttLoadingState />;
  }

  // Show empty state if no data
  if (ganttData.length === 0) {
    return <GanttEmptyState />;
  }

  return (
    <div className="w-full h-full flex flex-col gantt-chart-container">
      <div className="flex justify-between items-center mb-4">
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

export default EnhancedGanttChart;
