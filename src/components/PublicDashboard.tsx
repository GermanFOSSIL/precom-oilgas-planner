
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
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
  SunMoon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { Input } from "@/components/ui/input";
import PublicHeader from "@/components/PublicHeader";
import ProyectoSelector from "@/components/ProyectoSelector";
import AlertasWidget from "@/components/AlertasWidget";

const PublicDashboard: React.FC = () => {
  const { 
    proyectos, 
    filtros, 
    setFiltros, 
    theme, 
    toggleTheme,
    actividades,
    itrbItems,
    logout  // Add logout to clear user session
  } = useAppContext();

  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  // Effect to clear cache when component mounts
  useEffect(() => {
    // Force refresh filtros to ensure updated state
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
    // Esta funcionalidad podría implementarse más adelante
    alert("Exportación de gráfico no implementada aún");
  };

  // Limpiar sesión y recargar la página
  const handleResetSession = () => {
    logout();
    // Forzar recarga completa para limpiar cualquier caché del navegador
    window.location.reload();
  };

  // Ajustar altura del gráfico según tamaño seleccionado
  const getGanttHeight = () => {
    switch (configuracionGrafico.tamano) {
      case "pequeno": return "h-[400px]";
      case "mediano": return "h-[600px]";
      case "grande": return "h-[800px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
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
          </div>
        </div>
        
        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />
        
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <div>
              <CardTitle className="text-xl">
                Diagrama de Gantt
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Vista de actividades y ITR B por proyecto
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={configuracionGrafico.tamano}
                onValueChange={(value: any) => handleTamanoGrafico(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tamaño" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno">Pequeño</SelectItem>
                  <SelectItem value="mediano">Mediano</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                  <SelectItem value="completo">Pantalla completa</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportarGrafico} className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`p-0 overflow-hidden ${getGanttHeight()}`}>
            <EnhancedGanttChart
              filtros={filtros}
              configuracion={configuracionGrafico}
            />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Resumen de Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Aquí se podría añadir un resumen de actividades o alguna visualización */}
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Próximamente: Gráfico de progreso por sistema
              </div>
            </CardContent>
          </Card>
          
          <AlertasWidget />
        </div>
        
        <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;
