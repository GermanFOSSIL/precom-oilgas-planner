
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import KPICards from "@/components/KPICards";
import ActividadesTable from "@/components/ActividadesTable";
import ITRBTable from "@/components/ITRBTable";
import GanttChart from "@/components/GanttChart";
import { Calendar, FileText, Table2 } from "lucide-react";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { useAppContext } from "@/context/AppContext";

const Dashboard: React.FC = () => {
  const { filtros } = useAppContext();
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <KPICards />
        
        <Tabs defaultValue="gantt" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Gráfico Gantt</span>
            </TabsTrigger>
            <TabsTrigger value="actividades" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline">Actividades</span>
            </TabsTrigger>
            <TabsTrigger value="itrb" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">ITR B</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gantt" className="mt-0">
            <GanttChart 
              filtros={filtros} 
              configuracion={configuracionGrafico} 
            />
          </TabsContent>
          
          <TabsContent value="actividades" className="mt-0">
            <ActividadesTable />
          </TabsContent>
          
          <TabsContent value="itrb" className="mt-0">
            <ITRBTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
