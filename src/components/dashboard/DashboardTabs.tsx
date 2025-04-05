
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar } from "lucide-react";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import AlertasWidget from "@/components/AlertasWidget";
import CriticalPathView from "@/components/CriticalPathView";
import { ConfiguracionGrafico, FiltrosDashboard } from "@/types";

interface DashboardTabsProps {
  tabActual: string;
  setTabActual: (tab: string) => void;
  filtros: FiltrosDashboard;
  configuracionGrafico: ConfiguracionGrafico;
  mostrarSubsistemas: boolean;
  exportingChart: boolean;
  handleExportPDF: () => void;
  showHeaderControls: boolean;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabActual,
  setTabActual,
  filtros,
  configuracionGrafico,
  mostrarSubsistemas,
  exportingChart,
  handleExportPDF,
  showHeaderControls
}) => {
  const currentFilterTimestamp = String(Date.now());
  
  return (
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
  );
};

export default DashboardTabs;
