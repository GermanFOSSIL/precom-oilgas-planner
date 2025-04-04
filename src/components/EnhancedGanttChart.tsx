import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { addDays, subDays, startOfMonth, endOfMonth } from "date-fns";

import GanttLoadingState from "./gantt/GanttLoadingState";
import GanttEmptyState from "./gantt/GanttEmptyState";
import GanttNavigationControls from "./gantt/GanttNavigationControls";
import GanttBarChart from "./gantt/GanttBarChart";
import { useGanttData } from "./gantt/hooks/useGanttData";
import { generateSampleData } from "./gantt/utils/sampleData";

interface EnhancedGanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({ 
  filtros, 
  configuracion 
}) => {
  const { actividades: appActividades, itrbItems: appItrbItems, proyectos: appProyectos } = useAppContext();

  const today = new Date();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState<Date>(subDays(startOfMonth(today), 7));
  const [currentEndDate, setCurrentEndDate] = useState<Date>(endOfMonth(today));
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState<boolean>(false);

  const [sampleData, setSampleData] = useState<{
    actividades: any[];
    itrbItems: any[];
    proyectos: any[];
  }>({ actividades: [], itrbItems: [], proyectos: [] });

  useEffect(() => {
    setSampleData(generateSampleData());
  }, []);

  const actividades = usingSampleData ? sampleData.actividades : appActividades;
  const itrbItems = usingSampleData ? sampleData.itrbItems : appItrbItems;
  const proyectos = usingSampleData ? sampleData.proyectos : appProyectos;

  const mostrarSubsistemas = configuracion.mostrarSubsistemas !== undefined 
    ? configuracion.mostrarSubsistemas 
    : true;

  const { ganttData } = useGanttData(actividades, itrbItems, proyectos, filtros);

  const toggleSampleData = useCallback(() => {
    setUsingSampleData(prev => !prev);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [usingSampleData]);

  const navigateTime = (direction: "prev" | "next" | "today") => {
    let newStartDate = currentStartDate;
    let newEndDate = currentEndDate;

    if (direction === "today") {
      newStartDate = subDays(startOfMonth(today), 7);
      newEndDate = endOfMonth(today);
    } else if (direction === "prev") {
      const prevMonth = subDays(startOfMonth(addDays(currentStartDate, -1)), 7);
      newStartDate = prevMonth;
      newEndDate = endOfMonth(prevMonth);
    } else if (direction === "next") {
      const nextMonth = subDays(startOfMonth(addDays(currentEndDate, 1)), 7);
      newStartDate = nextMonth;
      newEndDate = endOfMonth(nextMonth);
    }

    setCurrentStartDate(newStartDate);
    setCurrentEndDate(newEndDate);
  };

  const handleViewModeChange = (newMode: "month" | "week" | "day") => {
    setViewMode(newMode);
    let newStartDate = new Date(currentStartDate);
    let duration;

    switch (newMode) {
      case "day":
        duration = 1;
        break;
      case "week":
        duration = 7;
        break;
      case "month":
      default:
        duration = 30;
        break;
    }

    const newEndDate = addDays(newStartDate, duration);
    setCurrentEndDate(newEndDate);
  };

  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
  };

  useEffect(() => {
    const exportPDFHandler = () => {
      console.log("Export PDF");
    };

    const exportExcelHandler = () => {
      console.log("Export Excel");
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

  if (loading) {
    return <GanttLoadingState />;
  }

  if (ganttData.length === 0) {
    return <GanttEmptyState />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex justify-between items-center mb-2">
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto w-full">
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
