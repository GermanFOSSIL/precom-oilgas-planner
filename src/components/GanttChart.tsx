
import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { addDays, addWeeks, addMonths, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FilterIcon, Calendar, AlertCircle, DownloadIcon } from "lucide-react";

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
  const ganttRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [itrFilter, setItrFilter] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | "Completado" | "En curso" | "Vencido">("todos");
  const [fechaInicioFilter, setFechaInicioFilter] = useState<string>("");
  const [fechaFinFilter, setFechaFinFilter] = useState<string>("");
  
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

  const { ganttData } = useGanttData(actividades, itrbItems, proyectos, {
    ...filtros,
    itrFilter: itrFilter,
    estadoITRB: estadoFilter !== "todos" ? estadoFilter : undefined,
    fechaInicioFilter: fechaInicioFilter || undefined,
    fechaFinFilter: fechaFinFilter || undefined
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Escuchar eventos para exportar Gantt
  useEffect(() => {
    const handleExportPDFEvent = () => {
      exportToPDF();
    };
    
    window.addEventListener('export-gantt-pdf', handleExportPDFEvent);
    
    return () => {
      window.removeEventListener('export-gantt-pdf', handleExportPDFEvent);
    };
  }, []);

  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
  };

  const handleViewModeChange = (newMode: "month" | "week" | "day") => {
    setViewMode(newMode);
    
    const { newStartDate, newEndDate } = calculateNewDateRange(
      currentStartDate,
      currentEndDate,
      "today",
      newMode
    );
    
    setCurrentStartDate(newStartDate);
    setCurrentEndDate(newEndDate);
  };

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

  const exportToPDF = async () => {
    if (!ganttRef.current) {
      toast.error("No se pudo encontrar el gráfico para exportar");
      console.error("Error: ganttRef.current es null");
      return;
    }

    try {
      toast.info("Generando PDF, por favor espere...");
      
      const originalWidth = ganttRef.current.style.width;
      const originalHeight = ganttRef.current.style.height;
      const originalOverflow = ganttRef.current.style.overflow;
      
      // Establecer dimensiones explícitas para captura
      ganttRef.current.style.width = `${ganttRef.current.scrollWidth}px`;
      ganttRef.current.style.height = `${ganttRef.current.scrollHeight}px`;
      ganttRef.current.style.overflow = 'visible';
      
      // Dar tiempo al navegador para aplicar los cambios de estilo
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      
      const Html2Canvas = html2canvas.default;
      const JsPDF = jsPDF.default;
      
      const canvas = await Html2Canvas(ganttRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: ganttRef.current.scrollWidth,
        windowHeight: ganttRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedGantt = clonedDoc.querySelector('[ref="gantt-container"]');
          if (clonedGantt) {
            (clonedGantt as HTMLElement).style.width = `${ganttRef.current!.scrollWidth}px`;
            (clonedGantt as HTMLElement).style.height = `${ganttRef.current!.scrollHeight}px`;
          }
        }
      });
      
      // Restaurar estilos originales
      ganttRef.current.style.width = originalWidth;
      ganttRef.current.style.height = originalHeight;
      ganttRef.current.style.overflow = originalOverflow;
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      const pdf = new JsPDF('landscape', 'mm', 'a4');
      
      pdf.setFontSize(16);
      pdf.text("Diagrama de Gantt - Plan de Precomisionado", 14, 15);
      
      pdf.setFontSize(10);
      pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 23);
      
      const filtrosAplicados = [];
      if (filtros.proyecto !== "todos") filtrosAplicados.push(`Proyecto: ${proyectos.find(p => p.id === filtros.proyecto)?.titulo || filtros.proyecto}`);
      if (filtros.sistema) filtrosAplicados.push(`Sistema: ${filtros.sistema}`);
      if (filtros.subsistema) filtrosAplicados.push(`Subsistema: ${filtros.subsistema}`);
      if (itrFilter) filtrosAplicados.push(`ITR: ${itrFilter}`);
      if (estadoFilter !== "todos") filtrosAplicados.push(`Estado: ${estadoFilter}`);
      if (fechaInicioFilter) filtrosAplicados.push(`Desde: ${fechaInicioFilter}`);
      if (fechaFinFilter) filtrosAplicados.push(`Hasta: ${fechaFinFilter}`);
      
      if (filtrosAplicados.length > 0) {
        pdf.text(`Filtros: ${filtrosAplicados.join(', ')}`, 14, 28);
      }
      
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 10, 35, imgWidth, imgHeight);
      
      pdf.save('gantt-plan-precomisionado.pdf');
      
      toast.success("PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      toast.error("Hubo un error al generar el PDF");
    }
  };

  const handleClearFilters = () => {
    setItrFilter("");
    setEstadoFilter("todos");
    setFechaInicioFilter("");
    setFechaFinFilter("");
    toast.success("Filtros restablecidos");
  };

  if (loading) {
    return <GanttLoadingState />;
  }

  if (ganttData.length === 0) {
    return <GanttEmptyState />;
  }

  return (
    <div className="w-full h-full flex flex-col gantt-chart-container" data-gantt-container="true">
      <div className="flex flex-col md:flex-row gap-2 mb-4 justify-between">
        <GanttNavigationControls
          currentStartDate={currentStartDate}
          currentEndDate={currentEndDate}
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          onNavigate={navigateTime}
          onViewModeChange={handleViewModeChange}
          onZoomChange={changeZoom}
        />
        
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <FilterIcon className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Filtrar diagrama de Gantt</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="itr-filter">Buscar ITR por nombre/código</Label>
                  <Input
                    id="itr-filter"
                    placeholder="Ej: ITR-B001 o Prueba..."
                    value={itrFilter}
                    onChange={(e) => setItrFilter(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="estado-filter">Estado de ITR</Label>
                  <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as "todos" | "Completado" | "En curso" | "Vencido")}>
                    <SelectTrigger id="estado-filter">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="En curso">En curso</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                    <Input
                      id="fecha-inicio"
                      type="date"
                      value={fechaInicioFilter}
                      onChange={(e) => setFechaInicioFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha-fin">Fecha Fin</Label>
                    <Input
                      id="fecha-fin"
                      type="date"
                      value={fechaFinFilter}
                      onChange={(e) => setFechaFinFilter(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                  <Button onClick={() => toast.success("Filtros aplicados")}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={exportToPDF} className="flex items-center gap-1">
            <DownloadIcon className="h-4 w-4 mr-1" />
            Exportar PDF
          </Button>
          
          {(itrFilter || estadoFilter !== "todos" || fechaInicioFilter || fechaFinFilter) && (
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">
              <AlertCircle className="h-3 w-3 mr-1" />
              Filtros activos
            </div>
          )}
        </div>
      </div>
      
      <div 
        className="overflow-y-auto min-h-0 flex-1 gantt-container" 
        ref={ganttRef}
      >
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
