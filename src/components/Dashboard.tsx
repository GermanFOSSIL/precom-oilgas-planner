
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import KPICards from "@/components/KPICards";
import ActividadesTable from "@/components/ActividadesTable";
import ITRBTable from "@/components/ITRBTable";
import GanttChart from "@/components/GanttChart";
import CriticalPathView from "@/components/CriticalPathView";
import { 
  Calendar, 
  FileText, 
  Table2, 
  Download, 
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ConfiguracionGrafico } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Dashboard: React.FC = () => {
  const { filtros } = useAppContext();
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  const [tabActual, setTabActual] = useState("gantt");

  const generarPDF = () => {
    const doc = new jsPDF();
    
    doc.text("Dashboard - Plan de Precomisionado", 14, 20);
    doc.text("Fecha: " + new Date().toLocaleDateString('es-ES'), 14, 30);
    
    doc.text("Este PDF contiene un resumen de las actividades y estados del plan.", 14, 40);
    
    doc.save("dashboard-precomisionado.pdf");
    toast.success("PDF generado exitosamente");
  };

  const handleTamanoGrafico = (tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico({ ...configuracionGrafico, tamano });
    toast.success(`Tamaño de gráfico ajustado a: ${tamano}`);
  };

  const handleMostrarLeyenda = () => {
    setConfiguracionGrafico({ 
      ...configuracionGrafico, 
      mostrarLeyenda: !configuracionGrafico.mostrarLeyenda 
    });
    toast.success(`Leyenda ${configuracionGrafico.mostrarLeyenda ? 'ocultada' : 'mostrada'}`);
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
        
        <Tabs 
          defaultValue="gantt" 
          className="w-full"
          value={tabActual}
          onValueChange={setTabActual}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-4 mb-0">
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
              <TabsTrigger value="critical-path" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Ruta Crítica</span>
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
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleMostrarLeyenda}
                  className={!configuracionGrafico.mostrarLeyenda ? "opacity-50" : ""}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const size = configuracionGrafico.tamano;
                    const sizes: ConfiguracionGrafico["tamano"][] = ["pequeno", "mediano", "grande", "completo"];
                    const currentIndex = sizes.indexOf(size);
                    const newSize = sizes[(currentIndex + 1) % sizes.length];
                    handleTamanoGrafico(newSize);
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
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

          <TabsContent value="critical-path" className="mt-0">
            <CriticalPathView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
