
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import AlertasWidget from "@/components/AlertasWidget";
import { ConfiguracionGrafico, FiltrosDashboard } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, AlertTriangle } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { useExportUtils } from "@/components/dashboard/ExportUtils";
import HeaderControls from "@/components/dashboard/HeaderControls";
import FilterControls from "@/components/dashboard/FilterControls";
import GanttControls from "@/components/dashboard/GanttControls";

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
    getKPIs
  } = useAppContext();

  const defaultConfiguracionGrafico: ConfiguracionGrafico = {
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true
  };

  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>(defaultConfiguracionGrafico);
  const [tabActual, setTabActual] = useState("gantt");
  const [exportingChart, setExportingChart] = useState(false);
  const [mostrarSubsistemas, setMostrarSubsistemas] = useState(true);
  const ganttChartRef = React.useRef<HTMLDivElement | null>(null);

  // This function ensures timestamps are always handled as strings
  const ensureStringTimestamp = useCallback((timestamp: number | string | undefined): string => {
    if (timestamp === undefined) return String(Date.now());
    return typeof timestamp === 'number' ? String(timestamp) : timestamp;
  }, []);

  // Safe update of filters
  const safeUpdateFilters = useCallback(() => {
    const currentTimestamp = ensureStringTimestamp(Date.now());
    setFiltros({
      ...filtros,
      timestamp: currentTimestamp
    });
  }, [ensureStringTimestamp, setFiltros, filtros]);

  // Update timestamp when component mounts or when dependency changes
  useEffect(() => {
    safeUpdateFilters();
    // Set up an interval to update the timestamp periodically to force refreshes
    const interval = setInterval(safeUpdateFilters, 60000); // Every minute
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

  const handleTamanoGrafico = useCallback((tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico(prev => ({ ...prev, tamano }));
  }, []);

  const handleResetSession = useCallback(() => {
    logout();
    window.location.reload();
  }, [logout]);

  const handleSubsistemaToggle = useCallback((checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setMostrarSubsistemas(checked);
      setConfiguracionGrafico(prev => ({
        ...prev,
        mostrarSubsistemas: checked
      }));
    }
  }, []);

  const getGanttHeight = useCallback(() => {
    const tamano = configuracionGrafico?.tamano || "mediano";
    
    switch (tamano) {
      case "pequeno": return "h-[400px]";
      case "mediano": return "h-[600px]";
      case "grande": return "h-[800px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
    }
  }, [configuracionGrafico?.tamano]);

  const { generarPDF, generarExcel } = useExportUtils({
    proyectos,
    actividades,
    itrbItems,
    getKPIs
  });

  const handleExportPDF = useCallback(async () => {
    setExportingChart(true);
    await generarPDF(filtros);
    setExportingChart(false);
  }, [filtros, generarPDF]);

  const handleExportExcel = useCallback(async () => {
    setExportingChart(true);
    await generarExcel(filtros);
    setExportingChart(false);
  }, [filtros, generarExcel]);

  const getGanttConfiguration = useCallback(() => {
    return {
      ...defaultConfiguracionGrafico,
      ...configuracionGrafico,
      mostrarSubsistemas: mostrarSubsistemas
    };
  }, [configuracionGrafico, mostrarSubsistemas]);

  // Memoized filter timestamp
  const currentFilterTimestamp = ensureStringTimestamp(Date.now());

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

        <div className="flex justify-end mb-4">
          <FilterControls 
            filtros={filtros}
            onFiltroChange={handleFiltroChange}
            onSubsistemaToggle={handleSubsistemaToggle}
            mostrarSubsistemas={mostrarSubsistemas}
          />
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
              <GanttControls 
                configuracionGrafico={configuracionGrafico}
                mostrarSubsistemas={mostrarSubsistemas}
                onTamanoGraficoChange={handleTamanoGrafico}
                onSubsistemasToggle={() => setMostrarSubsistemas(!mostrarSubsistemas)}
              />
            )}
          </div>
          
          <TabsContent value="gantt" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className={`p-0 overflow-hidden ${getGanttHeight()}`}>
                <div ref={ganttChartRef} className="w-full h-full">
                  <EnhancedGanttChart
                    filtros={{
                      ...filtros,
                      timestamp: currentFilterTimestamp
                    }}
                    configuracion={getGanttConfiguration()}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="critical-path" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0 overflow-hidden h-[600px]">
                {/* Componente de ruta crítica */}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alertas" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
              <AlertasWidget />
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
