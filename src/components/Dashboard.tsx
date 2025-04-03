
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import KPICards from "@/components/KPICards";
import ActividadesTable from "@/components/ActividadesTable";
import ITRBTable from "@/components/ITRBTable";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
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
import * as XLSX from 'xlsx';

const Dashboard: React.FC = () => {
  const { filtros, actividades, itrbItems, proyectos, getKPIs } = useAppContext();
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  const [tabActual, setTabActual] = useState("gantt");
  
  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.text("Dashboard - Plan de Precomisionado", 14, 20);
      doc.text("Fecha: " + new Date().toLocaleDateString('es-ES'), 14, 30);
      
      // Obtener KPIs para el proyecto seleccionado
      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
      
      // Proyecto actual
      const proyectoNombre = filtros.proyecto !== "todos" ? 
        proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos" : 
        "Todos los proyectos";
      
      doc.text(`Proyecto: ${proyectoNombre}`, 14, 40);
      
      // Tabla de KPIs
      const kpisData = [
        ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
        ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
        ["Subsistemas con CCC", `${kpis.subsistemasCCC}/${kpis.totalSubsistemas}`],
        ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
      ];
      
      (doc as any).autoTable({
        startY: 45,
        head: [["Indicador", "Valor"]],
        body: kpisData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      // Tabla de actividades filtradas por proyecto
      const actividadesFiltradas = actividades.filter(act => 
        filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
      );
      
      if (actividadesFiltradas.length > 0) {
        doc.text("Actividades", 14, (doc as any).lastAutoTable.finalY + 15);
        
        const actividadesData = actividadesFiltradas.map(act => [
          act.nombre,
          act.sistema,
          act.subsistema,
          new Date(act.fechaInicio).toLocaleDateString('es-ES'),
          new Date(act.fechaFin).toLocaleDateString('es-ES'),
          `${act.duracion} días`
        ]);
        
        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración']],
          body: actividadesData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
      
      // Tabla de ITR B filtrados por proyecto
      const itrbsFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || filtros.proyecto === "todos" || actividad.proyectoId === filtros.proyecto;
      });
      
      if (itrbsFiltrados.length > 0) {
        doc.text("ITR B", 14, (doc as any).lastAutoTable.finalY + 15);
        
        const itrbData = itrbsFiltrados.map(itrb => {
          const actividad = actividades.find(act => act.id === itrb.actividadId);
          return [
            itrb.descripcion,
            actividad?.sistema || "",
            actividad?.subsistema || "",
            `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
            itrb.estado,
            itrb.ccc ? "Sí" : "No"
          ];
        });
        
        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Descripción', 'Sistema', 'Subsistema', 'Realizado/Total', 'Estado', 'CCC']],
          body: itrbData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
      
      doc.save("dashboard-precomisionado.pdf");
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  const generarExcel = () => {
    try {
      // Crear libro Excel
      const wb = XLSX.utils.book_new();
      
      // Filtrar actividades según proyecto
      const actividadesFiltradas = actividades.filter(act => 
        filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
      );
      
      // Filtrar ITRBs según proyecto
      const itrbsFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || filtros.proyecto === "todos" || actividad.proyectoId === filtros.proyecto;
      });
      
      // Hoja de actividades
      if (actividadesFiltradas.length > 0) {
        const wsData = actividadesFiltradas.map(act => ({
          Nombre: act.nombre,
          Sistema: act.sistema,
          Subsistema: act.subsistema,
          "Fecha Inicio": new Date(act.fechaInicio).toLocaleDateString('es-ES'),
          "Fecha Fin": new Date(act.fechaFin).toLocaleDateString('es-ES'),
          "Duración (días)": act.duracion
        }));
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Actividades");
      }
      
      // Hoja de ITR B
      if (itrbsFiltrados.length > 0) {
        const wsData = itrbsFiltrados.map(itrb => {
          const actividad = actividades.find(act => act.id === itrb.actividadId);
          return {
            Descripción: itrb.descripcion,
            Actividad: actividad?.nombre || "",
            Sistema: actividad?.sistema || "",
            Subsistema: actividad?.subsistema || "",
            "Realizado/Total": `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
            "Progreso (%)": itrb.cantidadTotal > 0 ? ((itrb.cantidadRealizada / itrb.cantidadTotal) * 100).toFixed(1) + "%" : "0%",
            Estado: itrb.estado,
            CCC: itrb.ccc ? "Sí" : "No",
            "Fecha Límite": new Date(itrb.fechaLimite).toLocaleDateString('es-ES')
          };
        });
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "ITR B");
      }
      
      // Guardar Excel
      XLSX.writeFile(wb, "dashboard-precomisionado.xlsx");
      toast.success("Excel generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Panel de Control
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generarPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={generarExcel}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
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
            <EnhancedGanttChart 
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
