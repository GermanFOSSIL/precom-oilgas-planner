import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import CriticalPathView from "@/components/CriticalPathView";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Calendar, 
  FileText, 
  Table2, 
  Filter, 
  Search, 
  Download,
  SunMoon,
  AlertTriangle,
  Image,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { Input } from "@/components/ui/input";
import PublicHeader from "@/components/PublicHeader";
import ProyectoSelector from "@/components/ProyectoSelector";
import AlertasWidget from "@/components/AlertasWidget";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const PublicDashboard: React.FC = () => {
  const { 
    proyectos, 
    filtros, 
    setFiltros, 
    theme, 
    toggleTheme,
    actividades,
    itrbItems,
    logout,
    getKPIs
  } = useAppContext();

  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });
  
  const [tabActual, setTabActual] = useState("gantt");
  const ganttChartRef = useRef<HTMLDivElement | null>(null);
  const [exportingChart, setExportingChart] = useState(false);

  useEffect(() => {
    setFiltros({ ...filtros, timestamp: Date.now() });
  }, []);

  const sistemasDisponibles = Array.from(
    new Set(actividades.map(act => act.sistema))
  );

  const subsistemasFiltrados = Array.from(
    new Set(
      actividades
        .filter(act => !filtros.sistema || act.sistema === filtros.sistema)
        .map(act => act.subsistema)
    )
  );

  const handleFiltroChange = (key: keyof FiltrosDashboard, value: any) => {
    setFiltros({ ...filtros, [key]: value });
  };

  const handleTamanoGrafico = (tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico({ ...configuracionGrafico, tamano });
  };

  const handleResetSession = () => {
    logout();
    window.location.reload();
  };

  const getGanttHeight = () => {
    switch (configuracionGrafico.tamano) {
      case "pequeno": return "h-[400px]";
      case "mediano": return "h-[600px]";
      case "grande": return "h-[800px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
    }
  };

  const captureGanttChart = async (): Promise<string | null> => {
    try {
      const ganttContainers = Array.from(document.querySelectorAll('.gantt-chart-container'));
      const visibleGanttContainer = ganttContainers.find(el => 
        el instanceof HTMLElement && 
        el.offsetParent !== null && 
        window.getComputedStyle(el).display !== 'none'
      ) as HTMLElement;
      
      if (!visibleGanttContainer) {
        console.warn("No se pudo encontrar un diagrama de Gantt visible en el DOM");
        
        const ganttElement = document.querySelector('.recharts-wrapper') as HTMLElement;
        if (!ganttElement) {
          toast.error("No se pudo encontrar el diagrama de Gantt para exportar");
          return null;
        }
        
        const canvas = await html2canvas(ganttElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false
        });
        
        return canvas.toDataURL('image/png');
      }
      
      const clonedContainer = visibleGanttContainer.cloneNode(true) as HTMLElement;
      
      clonedContainer.style.position = 'absolute';
      clonedContainer.style.left = '-9999px';
      clonedContainer.style.width = `${visibleGanttContainer.scrollWidth}px`;
      clonedContainer.style.height = `${visibleGanttContainer.scrollHeight}px`;
      document.body.appendChild(clonedContainer);
      
      const canvas = await html2canvas(clonedContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: visibleGanttContainer.scrollWidth,
        height: visibleGanttContainer.scrollHeight
      });
      
      document.body.removeChild(clonedContainer);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error al capturar el diagrama de Gantt:", error);
      toast.error("No se pudo capturar el diagrama de Gantt. Intente nuevamente.");
      return null;
    }
  };

  const generateGanttDataForExcel = () => {
    const ganttData = actividades.filter(act => 
      filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
    ).map(act => {
      const proyecto = proyectos.find(p => p.id === act.proyectoId);
      const itrbAsociados = itrbItems.filter(i => i.actividadId === act.id);
      const itrbCompletados = itrbAsociados.filter(i => i.estado === "Completado").length;
      const totalItrb = itrbAsociados.length;
      const avance = totalItrb > 0 ? Math.round((itrbCompletados / totalItrb) * 100) : 0;
      
      return {
        Proyecto: proyecto?.titulo || 'N/A',
        ID: act.id,
        Actividad: act.nombre,
        Sistema: act.sistema,
        Subsistema: act.subsistema,
        'Fecha Inicio': new Date(act.fechaInicio).toLocaleDateString('es-ES'),
        'Fecha Fin': new Date(act.fechaFin).toLocaleDateString('es-ES'),
        'Duración (días)': act.duracion,
        'ITRBs Completados': `${itrbCompletados}/${totalItrb}`,
        'Avance (%)': `${avance}%`,
        'Estado': avance === 100 ? 'Completado' : avance > 0 ? 'En curso' : 'No iniciado'
      };
    });
    
    return ganttData;
  };

  const generarPDF = async () => {
    try {
      setExportingChart(true);
      
      const ganttImageData = await captureGanttChart();
      if (!ganttImageData) {
        toast.error("No se pudo capturar el diagrama de Gantt");
        setExportingChart(false);
        return;
      }
      
      const doc = new window.jsPDF({
        orientation: "landscape",
        unit: "mm"
      });
      
      doc.text("Dashboard - Plan de Precomisionado", 14, 20);
      doc.text("Fecha: " + new Date().toLocaleDateString('es-ES'), 14, 30);
      
      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
      
      const proyectoNombre = filtros.proyecto !== "todos" ? 
        proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos" : 
        "Todos los proyectos";
      
      doc.text(`Proyecto: ${proyectoNombre}`, 14, 40);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 28;
      const imgHeight = imgWidth * 0.5;
      
      try {
        doc.addImage(ganttImageData, 'PNG', 14, 45, imgWidth, imgHeight);
      } catch (err) {
        console.error("Error al agregar imagen del diagrama de Gantt:", err);
        doc.text("Error al incluir el diagrama de Gantt", 14, 45);
      }
      
      const kpisData = [
        ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
        ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
        ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`],
        ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
      ];
      
      (doc as any).autoTable({
        startY: 45 + imgHeight + 10,
        head: [["Indicador", "Valor"]],
        body: kpisData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      doc.save("gantt-chart-precomisionado.pdf");
      toast.success("PDF del diagrama de Gantt generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setExportingChart(false);
    }
  };

  const generarExcel = async () => {
    try {
      setExportingChart(true);
      
      const wb = XLSX.utils.book_new();
      
      const ganttData = generateGanttDataForExcel();
      
      const wsData = [
        ["DIAGRAMA DE GANTT - PLAN DE PRECOMISIONADO", "", "", "", "", "", "", "", "", ""],
        ["Proyecto: " + (filtros.proyecto !== "todos" ? 
          proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos" : 
          "Todos los proyectos"), "", "", "", "", "", "", "", "", ""],
        ["Fecha de exportación: " + new Date().toLocaleDateString('es-ES'), "", "", "", "", "", "", "", "", ""],
        [""],
        ["Proyecto", "ID", "Actividad", "Sistema", "Subsistema", "Fecha Inicio", "Fecha Fin", "Duración (días)", "ITRBs Completados", "Avance (%)", "Estado"]
      ];
      
      ganttData.forEach(row => {
        wsData.push([
          row.Proyecto,
          row.ID,
          row.Actividad,
          row.Sistema,
          row.Subsistema,
          row["Fecha Inicio"],
          row["Fecha Fin"],
          row["Duración (días)"],
          row["ITRBs Completados"],
          row["Avance (%)"],
          row.Estado
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      const colWidths = [
        { wch: 20 },
        { wch: 10 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 }
      ];
      
      ws['!cols'] = colWidths;
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Gantt Chart");
      
      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
      
      const kpisData = [
        ["KPIs - PLAN DE PRECOMISIONADO", ""],
        [""],
        ["Indicador", "Valor"],
        ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
        ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
        ["ITR B Completados (%)", `${kpis.totalITRB > 0 ? ((kpis.realizadosITRB / kpis.totalITRB) * 100).toFixed(1) : 0}%`],
        ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`],
        ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
      ];
      
      const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
      wsKPIs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      XLSX.utils.book_append_sheet(wb, wsKPIs, "KPIs");
      
      XLSX.writeFile(wb, "gantt-chart-precomisionado.xlsx");
      toast.success("Excel del diagrama de Gantt generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel");
    } finally {
      setExportingChart(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ProyectoSelector />
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleResetSession}
              title="Restablecer sesión"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <Select
              value={filtros.sistema || ""}
              onValueChange={(value) => handleFiltroChange("sistema", value || undefined)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sistemas</SelectItem>
                {sistemasDisponibles.map((sistema) => (
                  <SelectItem key={sistema} value={sistema}>
                    {sistema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filtros.subsistema || ""}
              onValueChange={(value) => handleFiltroChange("subsistema", value || undefined)}
              disabled={!filtros.sistema}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Subsistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los subsistemas</SelectItem>
                {subsistemasFiltrados.map((subsistema) => (
                  <SelectItem key={subsistema} value={subsistema}>
                    {subsistema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filtros.estadoITRB || ""}
              onValueChange={(value: any) => handleFiltroChange("estadoITRB", value || undefined)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="En curso">En curso</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => handleFiltroChange("tareaVencida", !filtros.tareaVencida)}
              className={filtros.tareaVencida ? "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Vencidas
            </Button>
            
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar actividad..."
                className="pl-8 w-full md:w-[200px]"
                value={filtros.busquedaActividad || ""}
                onChange={(e) => handleFiltroChange("busquedaActividad", e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={toggleTheme}
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <SunMoon className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={generarPDF}
              disabled={exportingChart}
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <Image className="h-4 w-4 mr-2" />
              Gantt PDF
            </Button>
            
            <Button 
              variant="outline" 
              onClick={generarExcel}
              disabled={exportingChart}
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Gantt Excel
            </Button>
          </div>
        </div>
        
        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />
        
        <Tabs 
          defaultValue="gantt" 
          className="w-full"
          value={tabActual}
          onValueChange={setTabActual}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-3 mb-0">
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Gráfico Gantt</span>
              </TabsTrigger>
              <TabsTrigger value="critical-path" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Ruta Crítica</span>
              </TabsTrigger>
              <TabsTrigger value="alertas" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
            </TabsList>

            {tabActual === "gantt" && (
              <div className="flex gap-2">
                <Select
                  value={configuracionGrafico.tamano}
                  onValueChange={(value: "pequeno" | "mediano" | "grande" | "completo") => 
                    handleTamanoGrafico(value)
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequeno">Pequeño</SelectItem>
                    <SelectItem value="mediano">Mediano</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                    <SelectItem value="completo">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <TabsContent value="gantt" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className={`p-0 overflow-hidden ${getGanttHeight()}`}>
                <div ref={ganttChartRef} className="w-full h-full">
                  <EnhancedGanttChart
                    filtros={filtros}
                    configuracion={configuracionGrafico}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="critical-path" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0 overflow-hidden h-[600px]">
                <CriticalPathView />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alertas" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
              <AlertasWidget />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;
