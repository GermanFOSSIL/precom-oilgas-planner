import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, SunMoon, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Login from "@/components/Login";
import PublicHeader from "@/components/PublicHeader";
import { toast } from "sonner";

const PublicDashboard: React.FC = () => {
  const { 
    proyectos, 
    theme, 
    toggleTheme, 
    actividades,
    login 
  } = useAppContext();
  
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ 
    proyecto: "todos", 
    timestamp: String(Date.now()) 
  });
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true
  });
  
  const [showLogin, setShowLogin] = useState(false);
  const [mostrarSubsistemas, setMostrarSubsistemas] = useState(true);
  const [tabActual, setTabActual] = useState("gantt");
  
  useEffect(() => {
    setFiltros({ ...filtros, timestamp: String(Date.now()) });
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
    if (key === 'timestamp') {
      setFiltros({ ...filtros, [key]: String(value) });
    } else {
      setFiltros({ ...filtros, [key]: value });
    }
  };
  
  const handleTamanoGrafico = (tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico({ ...configuracionGrafico, tamano });
  };
  
  const handleSubsistemaToggle = (checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setMostrarSubsistemas(checked);

      setConfiguracionGrafico({
        ...configuracionGrafico,
        mostrarSubsistemas: checked
      });
    }
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
  
  const handleLoginClick = () => {
    setShowLogin(true);
  };
  
  const handleLoginSuccess = (email: string) => {
    login(email)
      .then(success => {
        if (success) {
          toast.success("Inicio de sesión exitoso", {
            description: "Bienvenido(a) al sistema"
          });
          setShowLogin(false);
        } else {
          toast.error("Error de autenticación", {
            description: "No se pudo iniciar sesión"
          });
        }
      })
      .catch(error => {
        console.error("Error durante el login:", error);
        toast.error("Error de inicio de sesión", {
          description: "Ha ocurrido un error, intente nuevamente"
        });
      });
  };

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
              value={filtros.sistema || ""}
              onValueChange={(value) => handleFiltroChange("sistema", value || undefined)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los sistemas</SelectItem>
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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Subsistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los subsistemas</SelectItem>
                {subsistemasFiltrados.map((subsistema) => (
                  <SelectItem key={subsistema} value={subsistema}>
                    {subsistema}
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
            
            {tabActual === "gantt" && (
              <div className="flex gap-2">
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
              </div>
            )}
          </div>
          
          <TabsContent value="gantt" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className={`p-0 overflow-hidden ${getGanttHeight()}`}>
                <EnhancedGanttChart 
                  filtros={filtros} 
                  configuracion={{
                    ...configuracionGrafico,
                    mostrarSubsistemas
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="critical-path" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0 overflow-hidden h-[600px]">
                {/* Contenido de la ruta crítica */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700 mt-6">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
      
      {showLogin && (
        <Login onSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />
      )}
    </div>
  );
};

export default PublicDashboard;
