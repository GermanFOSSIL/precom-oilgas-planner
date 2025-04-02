
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Layers,
  FileText,
  Settings,
  Bell,
  SunMoon,
  Download
} from "lucide-react";
import KPICards from "@/components/KPICards";
import ProyectoSelector from "@/components/ProyectoSelector";
import GanttChart from "@/components/GanttChart";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";

const AdminPanel: React.FC = () => {
  const { user, logout, isAdmin, isTecnico, theme, toggleTheme, filtros } = useAppContext();
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  return (
    <div className={`min-h-screen flex ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 h-screen sticky top-0 flex flex-col">
        <div className="p-4 border-b dark:border-slate-700 flex items-center space-x-2">
          <Layers className="h-6 w-6 text-indigo-500" />
          <h1 className="text-xl font-bold text-indigo-500 dark:text-indigo-400">
            Pre-Comisionado
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Actividades
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            ITR B
          </Button>
          
          {isAdmin && (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Layers className="h-4 w-4 mr-2" />
              Proyectos
            </Button>
          )}
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </Button>
          
          {isAdmin && (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          )}
        </nav>
        
        <div className="p-4 border-t dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              <SunMoon className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">{user?.nombre || user?.email.split('@')[0]}</div>
            <div>{user?.email}</div>
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {isAdmin ? "Administrador" : isTecnico ? "Técnico" : "Visualizador"}
            </div>
          </div>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isAdmin ? "Panel de Administración" : "Panel de Técnico"}
          </h1>
          <ProyectoSelector />
        </div>
        
        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />
        
        <Tabs defaultValue="gantt" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="gantt">
              <Calendar className="h-4 w-4 mr-2" />
              Diagrama Gantt
            </TabsTrigger>
            <TabsTrigger value="actividades">
              <FileText className="h-4 w-4 mr-2" />
              Actividades
            </TabsTrigger>
            <TabsTrigger value="itrb">
              <CheckCircle className="h-4 w-4 mr-2" />
              ITR B
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <Bell className="h-4 w-4 mr-2" />
              Alertas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gantt">
            <Card>
              <CardContent className="p-0 h-[600px]">
                <GanttChart
                  filtros={filtros}
                  configuracion={configuracionGrafico}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="actividades">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground py-10">
                  Panel de administración de actividades (en desarrollo)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="itrb">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground py-10">
                  Panel de administración de ITR B (en desarrollo)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alertas">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground py-10">
                  Panel de administración de alertas (en desarrollo)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="py-6 border-t mt-6 text-center text-xs text-muted-foreground">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
