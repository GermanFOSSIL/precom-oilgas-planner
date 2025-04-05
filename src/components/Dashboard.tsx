
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import AlertasWidget from "@/components/AlertasWidget";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import { ConfiguracionGrafico, FiltrosDashboard } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, Check, Wrench } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { useExportUtils } from "@/components/dashboard/ExportUtils";
import HeaderControls from "@/components/dashboard/HeaderControls";
import FilterControls from "@/components/dashboard/FilterControls";
import CriticalPathView from "@/components/CriticalPathView";
import { toast } from "sonner";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ITRSidebarContent from "@/components/sidebar/ITRSidebarContent";

const Dashboard: React.FC = () => {
  const {
    proyectos,
    filtros,
    setFiltros,
    theme,
    toggleTheme,
    actividades,
    itrbItems,
    logout,
    getKPIs,
    user
  } = useAppContext();

  const defaultConfiguracionGrafico: ConfiguracionGrafico = {
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true
  };

  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>(defaultConfiguracionGrafico);
  const [tabActual, setTabActual] = useState("alertas");
  const [exportingChart, setExportingChart] = useState(false);
  const [mostrarSubsistemas, setMostrarSubsistemas] = useState(true);

  // Check if user has permission to manage ITRs (admin or technician role)
  const hasPermission = user && (user.role === "admin" || user.role === "tecnico");

  const ensureStringTimestamp = useCallback((timestamp: number | string | undefined): string => {
    if (timestamp === undefined) return String(Date.now());
    return typeof timestamp === 'number' ? String(timestamp) : timestamp;
  }, []);

  const safeUpdateFilters = useCallback(() => {
    const currentTimestamp = ensureStringTimestamp(Date.now());
    setFiltros({
      ...filtros,
      timestamp: currentTimestamp
    });
  }, [ensureStringTimestamp, setFiltros, filtros]);

  useEffect(() => {
    safeUpdateFilters();
    const interval = setInterval(safeUpdateFilters, 60000);
    return () => clearInterval(interval);
  }, [safeUpdateFilters]);

  const handleFiltroChange = useCallback((key: keyof FiltrosDashboard, value: any) => {
    if (key === 'timestamp') {
      setFiltros({
        ...filtros,
        [key]: ensureStringTimestamp(value)
      });
    } else {
      setFiltros({
        ...filtros,
        [key]: value
      });
    }
  }, [ensureStringTimestamp, setFiltros, filtros]);

  const handleResetFilters = useCallback(() => {
    setFiltros({
      proyecto: "todos",
      timestamp: ensureStringTimestamp(Date.now())
    });
    toast.success("Filtros restablecidos");
  }, [setFiltros, ensureStringTimestamp]);

  const handleResetSession = useCallback(() => {
    logout();
    window.location.reload();
  }, [logout]);

  const handleTamanoGrafico = useCallback((tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico(prev => ({ ...prev, tamano }));
  }, []);

  const handleSubsistemaToggle = useCallback((checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      setMostrarSubsistemas(checked);
      setConfiguracionGrafico(prev => ({
        ...prev,
        mostrarSubsistemas: checked
      }));
    }
  }, []);

  const getGanttHeight = useCallback(() => {
    switch (configuracionGrafico.tamano) {
      case "pequeno": return "h-[600px]";
      case "mediano": return "h-[800px]";
      case "grande": return "h-[1000px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
    }
  }, [configuracionGrafico.tamano]);

  // Function to transform getKPIs output into an array format for export
  const getKPIsForExport = useCallback((proyectoId?: string): any[] => {
    const kpiData = getKPIs(proyectoId);
    return [
      {
        titulo: "Avance Físico",
        valor: `${kpiData.avanceFisico.toFixed(1)}%`,
        descripcion: "Porcentaje de avance del proyecto"
      },
      {
        titulo: "ITRs Totales",
        valor: kpiData.totalITRB,
        descripcion: "Cantidad total de ITRs"
      },
      {
        titulo: "ITRs Realizados",
        valor: kpiData.realizadosITRB,
        descripcion: "Cantidad de ITRs realizados"
      },
      {
        titulo: "Subsistemas con MCC",
        valor: `${kpiData.subsistemasMCC} de ${kpiData.totalSubsistemas}`,
        descripcion: "Subsistemas que contienen MCC"
      },
      {
        titulo: "Actividades Vencidas",
        valor: kpiData.actividadesVencidas,
        descripcion: "Cantidad de actividades vencidas"
      }
    ];
  }, [getKPIs]);

  const { generarPDF, generarExcel } = useExportUtils({
    proyectos,
    actividades,
    itrbItems,
    getKPIs: getKPIsForExport
  });

  const handleExportPDF = useCallback(async () => {
    setExportingChart(true);
    try {
      await generarPDF(filtros);
      toast.success("Documento PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el documento PDF");
    } finally {
      setExportingChart(false);
    }
  }, [filtros, generarPDF]);

  const handleExportExcel = useCallback(async () => {
    setExportingChart(true);
    try {
      await generarExcel(filtros);
      toast.success("Documento Excel generado correctamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el documento Excel");
    } finally {
      setExportingChart(false);
    }
  }, [filtros, generarExcel]);

  const currentFilterTimestamp = ensureStringTimestamp(Date.now());

  // Only show the ITR completion button for technical users
  const isTechnician = user && user.role === "tecnico";

  return (
    <div className={`min-h-screen flex flex-col ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 py-6">
        <HeaderControls 
          onResetSession={handleResetSession}
          onToggleTheme={toggleTheme}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          exportingChart={exportingChart}
        />

        <div className="flex justify-between mb-4 flex-wrap gap-2">
          <FilterControls 
            filtros={filtros}
            onFiltroChange={handleFiltroChange}
            onSubsistemaToggle={handleSubsistemaToggle}
            mostrarSubsistemas={mostrarSubsistemas}
            onClearAllFilters={handleResetFilters}
          />
        </div>

        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />

        {/* Add the prominent green button for technicians */}
        {isTechnician && hasPermission && (
          <div className="my-4 flex justify-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2 px-6 py-3 shadow-md"
                >
                  <Wrench className="h-5 w-5" />
                  Completar ITRs
                </Button>
              </SheetTrigger>
              <ITRSidebarContent />
            </Sheet>
          </div>
        )}

        <Tabs
          defaultValue="alertas"
          className="w-full"
          value={tabActual}
          onValueChange={setTabActual}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-2 mb-0">
              <TabsTrigger value="alertas" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Gráfico Gantt</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="alertas" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
              <AlertasWidget />
            </div>
          </TabsContent>
          
          <TabsContent value="gantt" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0 h-[calc(100vh-280px)] overflow-y-auto gantt-chart-container">
                <EnhancedGanttChart 
                  filtros={{
                    ...filtros,
                    timestamp: currentFilterTimestamp
                  }} 
                  configuracion={{
                    ...configuracionGrafico,
                    mostrarSubsistemas
                  }}
                />
              </CardContent>
            </Card>

            {/* Always show the Critical Path for all users */}
            <div className="mt-6">
              <Card className="dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h2 className="text-xl font-bold flex items-center mb-4">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                      Camino Crítico
                    </h2>
                    <CriticalPathView />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700 mt-6">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
