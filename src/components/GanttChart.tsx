
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
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [fechaInicioFilter, setFechaInicioFilter] = useState<string>("");
  const [fechaFinFilter, setFechaFinFilter] = useState<string>("");
  
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
  const { ganttData } = useGanttData(actividades, itrbItems, proyectos, {
    ...filtros,
    itrFilter: itrFilter,
    estadoITRB: estadoFilter !== "todos" ? estadoFilter : undefined,
    fechaInicioFilter: fechaInicioFilter || undefined,
    fechaFinFilter: fechaFinFilter || undefined
  });

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

  // Exportar a PDF con html2canvas y jsPDF
  const exportToPDF = async () => {
    if (!ganttRef.current) {
      toast.error("No se pudo encontrar el gráfico para exportar");
      return;
    }

    try {
      toast.info("Generando PDF, por favor espere...");
      
      // Importamos las librerías dinámicamente para mejorar rendimiento
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      
      const Html2Canvas = html2canvas.default;
      const JsPDF = jsPDF.default;
      
      // Capturar elemento Gantt
      const canvas = await Html2Canvas(ganttRef.current, {
        scale: 1.5, // Mayor calidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: ganttRef.current.scrollWidth,
        windowHeight: ganttRef.current.scrollHeight
      });
      
      // Dimensiones de la imagen
      const imgWidth = 210; // A4 width (210mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Crear PDF (orientación horizontal para gráficos Gantt)
      const pdf = new JsPDF('landscape', 'mm', 'a4');
      
      // Añadir título
      pdf.setFontSize(16);
      pdf.text("Diagrama de Gantt - Plan de Precomisionado", 14, 15);
      
      // Añadir fecha de generación
      pdf.setFontSize(10);
      pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 23);
      
      // Añadir filtros aplicados
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
      
      // Añadir imagen al PDF (posición y tamaño)
      // Ajustamos la posición Y para dejar espacio para el encabezado
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 10, 35, imgWidth, imgHeight);
      
      // Guardar PDF
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
    <div className="w-full h-full flex flex-col gantt-chart-container">
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
          {/* Filtros rápidos */}
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
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
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
          
          {/* Indicador de filtros activos */}
          {(itrFilter || estadoFilter !== "todos" || fechaInicioFilter || fechaFinFilter) && (
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">
              <AlertCircle className="h-3 w-3 mr-1" />
              Filtros activos
            </div>
          )}
        </div>
      </div>
      
      {/* Contenedor con overflow y altura flexible */}
      <div className="overflow-y-auto min-h-0 flex-1" ref={ganttRef}>
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
