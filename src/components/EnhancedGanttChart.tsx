import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";

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
  configuracion,
}) => {
  const {
    actividades: appActividades,
    itrbItems: appItrbItems,
    proyectos: appProyectos,
  } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState<Date>(startOfMonth(new Date()));
  const [currentEndDate, setCurrentEndDate] = useState<Date>(endOfMonth(new Date()));
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

  const mostrarSubsistemas =
    configuracion.mostrarSubsistemas !== undefined
      ? configuracion.mostrarSubsistemas
      : true;

  const { ganttData } = useGanttData(
    actividades,
    itrbItems,
    proyectos,
    filtros
  );

  const toggleSampleData = useCallback(() => {
    setUsingSampleData((prev) => !prev);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [usingSampleData]);

  const navigateTime = (direction: "prev" | "next" | "today") => {
    let newDate = new Date(currentStartDate);
    if (direction === "prev") newDate = addMonths(currentStartDate, -1);
    else if (direction === "next") newDate = addMonths(currentStartDate, 1);
    else newDate = new Date();

    setCurrentStartDate(startOfMonth(newDate));
    setCurrentEndDate(endOfMonth(newDate));
  };

  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
  };

  const handleViewModeChange = (newMode: "month" | "week" | "day") => {
    setViewMode(newMode);
    // Podés agregar ajustes dinámicos para fechas por vista
  };

  if (loading) return <GanttLoadingState />;
  if (ganttData.length === 0) return <GanttEmptyState />;

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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                usingSampleData ? "bg-primary" : "bg-input"
              }`}
              onClick={toggleSampleData}
              role="button"
              tabIndex={0}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  usingSampleData ? "translate-x-6" : "translate-x-1"
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
