
import React, { useState, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { Input } from "@/components/ui/input";
import PublicHeader from "@/components/PublicHeader";
import ProyectoSelector from "@/components/ProyectoSelector";
import AlertasWidget from "@/components/AlertasWidget";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

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

  const exportarGrafico = () => {
    generarPDF();
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

  const generarPDF = () => {
    try {
      const doc = new window.jsPDF();
      
      doc.text("Dashboard - Plan de Precomisionado", 14, 20);
      doc.text("Fecha: " + new Date().toLocaleDateString('es-ES'), 14, 30);
      
      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
      
      const proyectoNombre = filtros.proyecto !== "todos" ? 
        proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos" : 
        "Todos los proyectos";
      
      doc.text(`Proyecto: ${proyectoNombre}`, 14, 40);
      
      const kpisData = [
        ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
        ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
        ["Subsistemas con MCC", `${kpis.subsistemasCCC}/${kpis.totalSubsistemas}`],
        ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
      ];
      
      (doc as any).autoTable({
        startY: 45,
        head: [["Indicador", "Valor"]],
        body: kpisData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      const actividadesFiltradas = actividades.filter(act => 
        filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
      );
      
      if (actividadesFiltradas.length > 0) {
        doc.text("Actividades", 14, (doc as any).lastAutoTable.finalY + 15);
        
        const actividadesData = actividadesFiltradas.map(act => [
          act.nombre,
          act.sistema,
          act.subsistema,
          new Date(act.fechaInicio).toLocaleDateString('es-ES'),
          new Date(act.fechaFin).toLocaleDateString('es-ES'),
          `${act.duracion} días`
        ]);
        
        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración']],
          body: actividadesData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
      
      const itrbsFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || filtros.proyecto === "todos" || actividad.proyectoId === filtros.proyecto;
      });
      
      if (itrbsFiltrados.length > 0) {
        doc.text("ITR B", 14, (doc as any).lastAutoTable.finalY + 15);
        
        const itrbData = itrbsFiltrados.map(itrb => {
          const actividad = actividades.find(act => act.id === itrb.actividadId);
          return [
            itrb.descripcion,
            actividad?.sistema || "",
            actividad?.subsistema || "",
            `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
            itrb.estado,
            itrb.ccc ? "Sí" : "No" // Mantiene ccc en el código pero se muestra como MCC
          ];
        });
        
        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Descripción', 'Sistema', 'Subsistema', 'Realizado/Total', 'Estado', 'MCC']], // Cambiado de CCC a MCC
          body: itrbData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
      
      doc.save("dashboard-precomisionado.pdf");
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  const generarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const actividadesFiltradas = actividades.filter(act => 
        filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
      );
      
      const itrbsFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || filtros.proyecto === "todos" || actividad.proyectoId === filtros.proyecto;
      });
      
      if (actividadesFiltradas.length > 0) {
        const wsData = actividadesFiltradas.map(act => ({
          Nombre: act.nombre,
          Sistema: act.sistema,
          Subsistema: act.subsistema,
          "Fecha Inicio": new Date(act.fechaInicio).toLocaleDateString('es-ES'),
          "Fecha Fin": new Date(act.fechaFin).toLocaleDateString('es-ES'),
          "Duración (días)": act.duracion
        }));
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Actividades");
      }
      
      if (itrbsFiltrados.length > 0) {
        const wsData = itrbsFiltrados.map(itrb => {
          const actividad = actividades.find(act => act.id === itrb.actividadId);
          return {
            Descripción: itrb.descripcion,
            Actividad: actividad?.nombre || "",
            Sistema: actividad?.sistema || "",
            Subsistema: actividad?.subsistema || "",
            "Realizado/Total": `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
            "Progreso (%)": itrb.cantidadTotal > 0 ? ((itrb.cantidadRealizada / itrb.cantidadTotal) * 100).toFixed(1) + "%" : "0%",
            Estado: itrb.estado,
            MCC: itrb.ccc ? "Sí" : "No", // Cambiado de CCC a MCC
            "Fecha Límite": new Date(itrb.fechaLimite).toLocaleDateString('es-ES')
          };
        });
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "ITR B");
      }
      
      XLSX.writeFile(wb, "dashboard-precomisionado.xlsx");
      toast.success("Excel generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel");
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
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            
            <Button 
              variant="outline" 
              onClick={generarExcel}
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <FileText className="h-4 w-4 mr-2" />
              Excel
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
                <EnhancedGanttChart
                  filtros={filtros}
                  configuracion={configuracionGrafico}
                />
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
