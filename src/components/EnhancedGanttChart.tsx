
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Gantt, Task, ViewMode, DisplayOption, StylingOption } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

// Importación de componentes y hooks existentes
import GanttLoadingState from "./gantt/GanttLoadingState";
import GanttEmptyState from "./gantt/GanttEmptyState";
import GanttNavigationControls from "./gantt/GanttNavigationControls";
import { useGanttData } from "./gantt/hooks/useGanttData";
import { generateSampleData } from "./gantt/utils/sampleData";

// Import custom styles for enhanced Gantt
import "./gantt/styles/EnhancedGantt.css";

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
  const [ganttTasks, setGanttTasks] = useState<Task[]>([]);

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

  // Transformar datos al formato requerido por la librería gantt-task-react
  useEffect(() => {
    if (ganttData.length > 0) {
      const transformedTasks: Task[] = [];
      
      ganttData.forEach((item, index) => {
        // Agregar la tarea principal (actividad)
        const actividadId = `actividad-${item.id}`;
        transformedTasks.push({
          id: actividadId,
          name: item.nombre,
          start: new Date(item.fechaInicio),
          end: new Date(item.fechaFin),
          progress: item.progreso / 100,
          type: 'project',
          hideChildren: false,
          displayOrder: index * 10,
          styles: {
            progressColor: item.color,
            progressSelectedColor: item.color,
            backgroundColor: `${item.color}50`, // Semi-transparente
            backgroundSelectedColor: `${item.color}90`,
          },
          project: item.proyecto,
          sistema: item.sistema,
          subsistema: item.subsistema,
        });
        
        // Agregar los ITRBs asociados como sub-tareas
        item.itrbsAsociados.forEach((itrb, itrbIndex) => {
          const estado = itrb.estado || 'En curso';
          const progress = estado === 'Completado' ? 100 : 
                           estado === 'Vencido' ? 0 : 50;
          
          let itrbColor = '#4299e1'; // Azul por defecto
          if (estado === 'Completado') itrbColor = '#48bb78'; // Verde
          if (estado === 'Vencido') itrbColor = '#f56565'; // Rojo
          
          transformedTasks.push({
            id: `itrb-${itrb.id}`,
            name: itrb.descripcion || `ITRB ${itrbIndex + 1}`,
            start: new Date(itrb.fechaInicio || item.fechaInicio),
            end: new Date(itrb.fechaVencimiento || itrb.fechaLimite || item.fechaFin),
            progress: progress / 100,
            type: 'task',
            project: actividadId,
            displayOrder: index * 10 + itrbIndex + 1,
            styles: {
              progressColor: itrbColor,
              progressSelectedColor: itrbColor,
              backgroundColor: `${itrbColor}50`,
              backgroundSelectedColor: `${itrbColor}90`,
            },
            isDisabled: false,
          });
        });
      });
      
      setGanttTasks(transformedTasks);
    }
  }, [ganttData]);

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

  // Convertir viewMode interno a formato de la librería
  const getLibraryViewMode = (): ViewMode => {
    switch (viewMode) {
      case "day": return ViewMode.Day;
      case "week": return ViewMode.Week;
      case "month": return ViewMode.Month;
      default: return ViewMode.Month;
    }
  };

  // Opciones de visualización para el componente Gantt
  const displayOptions: DisplayOption = {
    viewMode: getLibraryViewMode(),
    viewDate: new Date((currentStartDate.getTime() + currentEndDate.getTime()) / 2),
    ganttHeight: configuracion.tamano === "pequeno" ? 400 : 
                configuracion.tamano === "mediano" ? 600 : 
                configuracion.tamano === "grande" ? 800 : 1000,
    locale: 'es',
    preStepsCount: 1,
  };

  const columnWidth = zoomLevel * (
    viewMode === "day" ? 60 : 
    viewMode === "week" ? 50 : 40
  );

  const handleExpanderClick = (task: Task) => {
    console.log('Expander clicked for task:', task);
    // Si necesitamos manejar la expansión/contracción manualmente
  };

  useEffect(() => {
    const exportPDFHandler = () => {
      console.log("Export PDF");
      // Implementación de exportación PDF
    };

    const exportExcelHandler = () => {
      console.log("Export Excel");
      // Implementación de exportación Excel
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
      <div className="sticky top-0 z-10 bg-background mb-2">
        <div className="flex justify-between items-center">
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
        {ganttTasks.length > 0 && (
          <div className={`gantt-container ${viewMode === 'month' ? 'month-view' : viewMode === 'week' ? 'week-view' : 'day-view'}`}>
            <Gantt
              tasks={ganttTasks}
              viewMode={getLibraryViewMode()}
              onDateChange={(task) => console.log("Date changed", task)}
              onProgressChange={(task) => console.log("Progress changed", task)}
              onDoubleClick={(task) => console.log("Double clicked", task)}
              onClick={(task) => console.log("Clicked", task)}
              onSelect={(task) => console.log("Selected", task)}
              onExpanderClick={handleExpanderClick}
              listCellWidth={mostrarSubsistemas ? "240px" : "180px"}
              columnWidth={columnWidth}
              ganttHeight={displayOptions.ganttHeight}
              locale="es"
              viewDate={displayOptions.viewDate}
              TooltipContent={({ task }) => (
                <div className="gantt-tooltip p-2 rounded shadow-lg bg-background border">
                  <div className="font-bold">{task.name}</div>
                  <div className="text-sm">
                    Progreso: {Math.round(task.progress * 100)}%
                  </div>
                  <div className="text-sm">
                    {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
                  </div>
                  {task.project && task.type === 'task' && (
                    <div className="text-sm text-muted-foreground">
                      ITRB de actividad
                    </div>
                  )}
                  {task.sistema && (
                    <div className="text-sm">
                      Sistema: {task.sistema}
                    </div>
                  )}
                  {task.subsistema && mostrarSubsistemas && (
                    <div className="text-sm">
                      Subsistema: {task.subsistema}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </div>

      {configuracion.mostrarLeyenda && (
        <div className="mt-4 p-2 bg-muted rounded-md">
          <div className="text-sm font-medium mb-2">Leyenda</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-green-500"></div>
              <span className="text-xs">Completado</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-blue-500"></div>
              <span className="text-xs">En progreso</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-red-500"></div>
              <span className="text-xs">Vencido</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded bg-gray-500"></div>
              <span className="text-xs">No iniciado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGanttChart;
