
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import KPICards from "@/components/KPICards";
import ActividadesTable from "@/components/ActividadesTable";
import ITRBTable from "@/components/ITRBTable";
import GanttChart from "@/components/GanttChart";
import { Calendar, FileText, Table2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfiguracionGrafico } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

const Dashboard: React.FC = () => {
  const { filtros } = useAppContext();
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  const generarPDF = () => {
    const doc = new window.jsPDF();
    
    doc.text("Dashboard - Plan de Precomisionado", 14, 20);
    doc.text("Fecha: " + new Date().toLocaleDateString('es-ES'), 14, 30);
    
    doc.text("Este PDF contiene un resumen de las actividades y estados del plan.", 14, 40);
    
    doc.save("dashboard-precomisionado.pdf");
    toast.success("PDF generado exitosamente");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Panel de Control
          </h1>
          <Button variant="outline" onClick={generarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
        
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
