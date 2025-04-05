import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, SunMoon, AlertTriangle, Eye, EyeOff, FileText, FileSpreadsheet, Database, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PublicHeader from "@/components/PublicHeader";
import { toast } from "sonner";
import CriticalPathView from "@/components/CriticalPathView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PublicDashboard: React.FC = () => {
  const { 
    proyectos, 
    theme, 
    toggleTheme, 
    actividades
  } = useAppContext();
  
  const navigate = useNavigate();
  
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ 
    proyecto: "todos", 
    timestamp: String(Date.now()) 
  });
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true
  });
  
  const [mostrarSubsistemas, setMostrarSubsistemas] = useState(true);
  const [tabActual, setTabActual] = useState("gantt");
  
  const ensureStringTimestamp = useCallback((timestamp: number | string | undefined): string => {
    if (timestamp === undefined) return String(Date.now());
    return typeof timestamp === 'number' ? String(timestamp) : timestamp;
  }, []);
  
  useEffect(() => {
    const updateTimestamp = () => {
      setFiltros(prev => ({ 
        ...prev, 
        timestamp: ensureStringTimestamp(Date.now()) 
      }));
    };
    
    updateTimestamp();
    
    const interval = setInterval(updateTimestamp, 60000);
    
    return () => clearInterval(interval);
  }, [ensureStringTimestamp]);
  
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
  
  const handleFiltroChange = useCallback((key: keyof FiltrosDashboard, value: any) => {
    if (key === 'timestamp') {
      setFiltros(prev => ({ ...prev, [key]: ensureStringTimestamp(value) }));
    } else {
      setFiltros(prev => ({ ...prev, [key]: value }));
    }
  }, [ensureStringTimestamp]);
  
  const handleTamanoGrafico = useCallback((tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico(prev => ({ ...prev, tamano }));
  }, []);
  
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
    switch (configuracionGrafico.tamano) {
      case "pequeno": return "h-[400px]";
      case "mediano": return "h-[600px]";
      case "grande": return "h-[800px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
    }
  }, [configuracionGrafico.tamano]);
  
  const handleLoginClick = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const handleExportGantt = useCallback(() => {
    try {
      const ganttContainer = document.querySelector('.gantt-chart-container');
      if (!ganttContainer) {
        toast.error("No se encontró un gráfico Gantt para exportar");
        return;
      }
      
      const exportEvent = new CustomEvent('export-gantt-pdf');
      window.dispatchEvent(exportEvent);
      toast.success("Exportando a PDF...");
    } catch (error) {
      console.error("Error al iniciar la exportación:", error);
      toast.error("Error al iniciar la exportación del gráfico Gantt");
    }
  }, []);

  const handleExportExcel = useCallback(() => {
    try {
      const exportEvent = new CustomEvent('export-gantt-excel');
      window.dispatchEvent(exportEvent);
      toast.success("Exportando a Excel...");
    } catch (error) {
      console.error("Error al iniciar la exportación a Excel:", error);
      toast.error("Error al iniciar la exportación a Excel");
    }
  }, []);

  const handleToggleDemoData = useCallback(() => {
    const toggleEvent = new CustomEvent('toggle-demo-data');
    window.dispatchEvent(toggleEvent);
    toast.success("Cambiando origen de datos...");
  }, []);

  const currentFilterTimestamp = ensureStringTimestamp(Date.now());

  return (
    <div className={`min-h-screen flex flex-col ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <PublicHeader onLoginClick={handleLoginClick} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={filtros.proyecto}
              onValueChange={(value) => handleFiltroChange("proyecto", value)}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los proyectos</SelectItem>
                {proyectos.map(proyecto => (
                  <SelectItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <Select
              value={filtros.sistema || "todos"}
              onValueChange={(value) => handleFiltroChange("sistema", value !== "todos" ? value : undefined)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sistemas</SelectItem>
                {sistemasDisponibles.map((sistema) => (
                  <SelectItem key={sistema} value={sistema || "sin-sistema"}>
                    {sistema || "Sin sistema"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filtros.subsistema || "todos"}
              onValueChange={(value) => handleFiltroChange("subsistema", value !== "todos" ? value : undefined)}
              disabled={!filtros.sistema}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Subsistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los subsistemas</SelectItem>
                {subsistemasFiltrados.map((subsistema) => (
                  <SelectItem key={subsistema} value={subsistema || "sin-subsistema"}>
                    {subsistema || "Sin subsistema"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={toggleTheme}
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <SunMoon className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border border-gray-200">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Exportar datos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportGantt}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gantt PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Gantt Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleDemoData}>
                  <Database className="h-4 w-4 mr-2" />
                  Cambiar a {actividades.length > 0 ? 'datos demo' : 'datos reales'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <TabsList className="grid w-full md:w-auto grid-cols-2 mb-0">
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Gráfico Gantt</span>
              </TabsTrigger>
              <TabsTrigger value="critical-path" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Ruta Crítica</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                onClick={handleExportGantt}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              {tabActual === "gantt" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarSubsistemas(!mostrarSubsistemas)}
                    className="flex items-center gap-1"
                  >
                    {mostrarSubsistemas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {mostrarSubsistemas ? "Ocultar subsistemas" : "Mostrar subsistemas"}
                  </Button>
                  
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
                </>
              )}
            </div>
          </div>
          
          <TabsContent value="gantt" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className={`p-0 ${getGanttHeight()} flex flex-col`}>
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
          
          <TabsContent value="critical-path" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0 h-[600px] flex flex-col">
                <CriticalPathView />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700 mt-6">
          <div className="mb-2 text-sm italic text-gray-600 dark:text-gray-400">
            Del plan al arranque, en una sola plataforma.
          </div>
          FOSSIL Precom Track Plan | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;
