
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportGenerator: React.FC = () => {
  const { actividades, itrbItems, proyectos, proyectoActual, filtros } = useAppContext();
  
  // Función para generar PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const title = proyectoActual !== "todos" 
      ? `Plan de Precomisionado - ${proyectos.find(p => p.id === proyectoActual)?.titulo || 'Todos los proyectos'}`
      : "Plan de Precomisionado - Todos los proyectos";
    
    // Configuración de estilos
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    
    // Fecha de generación
    const currentDate = new Date().toLocaleDateString('es-ES');
    doc.text(`Fecha de generación: ${currentDate}`, 14, 30);
    
    // Filtrar actividades según la selección actual
    const actividadesFiltradas = actividades.filter(act => 
      proyectoActual === "todos" || act.proyectoId === proyectoActual
    );
    
    // Filtrar ITRBs según la selección actual
    const itrbFiltrados = itrbItems.filter(itrb => {
      const actividad = actividades.find(act => act.id === itrb.actividadId);
      return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
    });
    
    // Sección de Estadísticas
    doc.setFontSize(16);
    doc.text("Resumen Estadístico", 14, 40);
    
    const totalActividades = actividadesFiltradas.length;
    const totalITRB = itrbFiltrados.length;
    const itrbCompletados = itrbFiltrados.filter(itrb => itrb.estado === "Completado").length;
    const itrbEnCurso = itrbFiltrados.filter(itrb => itrb.estado === "En curso").length;
    const itrbVencidos = itrbFiltrados.filter(itrb => itrb.estado === "Vencido").length;
    
    const porcentajeCompletado = totalITRB > 0 ? (itrbCompletados / totalITRB) * 100 : 0;
    
    // Tabla de estadísticas
    const estadisticasData = [
      ["Total de Actividades", totalActividades.toString()],
      ["Total de ITR B", totalITRB.toString()],
      ["ITR B Completados", `${itrbCompletados} (${porcentajeCompletado.toFixed(2)}%)`],
      ["ITR B En Curso", itrbEnCurso.toString()],
      ["ITR B Vencidos", itrbVencidos.toString()]
    ];
    
    (doc as any).autoTable({
      startY: 45,
      head: [["Estadística", "Valor"]],
      body: estadisticasData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    let yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Sección de Actividades
    if (actividadesFiltradas.length > 0) {
      doc.setFontSize(16);
      doc.text("Listado de Actividades", 14, yPos);
      
      const actividadesData = actividadesFiltradas.map(act => {
        const proyecto = proyectos.find(p => p.id === act.proyectoId);
        return [
          act.nombre,
          act.sistema,
          act.subsistema,
          new Date(act.fechaInicio).toLocaleDateString('es-ES'),
          new Date(act.fechaFin).toLocaleDateString('es-ES'),
          `${act.duracion} días`,
          proyecto?.titulo || "N/A"
        ];
      });
      
      (doc as any).autoTable({
        startY: yPos + 5,
        head: [['Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración', 'Proyecto']],
        body: actividadesData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Verificar si necesitamos agregar una nueva página
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    // Sección de ITR B
    if (itrbFiltrados.length > 0) {
      doc.setFontSize(16);
      doc.text("Listado de ITR B", 14, yPos);
      
      const itrbData = itrbFiltrados.map(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return [
          itrb.descripcion,
          actividad ? actividad.nombre : "N/A",
          actividad ? actividad.sistema : "N/A",
          `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
          itrb.estado,
          itrb.ccc ? 'Sí' : 'No',
          new Date(itrb.fechaLimite).toLocaleDateString('es-ES')
        ];
      });
      
      (doc as any).autoTable({
        startY: yPos + 5,
        head: [['Descripción', 'Actividad', 'Sistema', 'Progreso', 'Estado', 'CCC', 'Fecha Límite']],
        body: itrbData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    // Pie de página en todas las páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount} - Plan de Precomisionado v1.0.0`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    // Guardar PDF
    doc.save(`plan_precomisionado_${currentDate.replace(/\//g, '-')}.pdf`);
    toast.success("PDF generado exitosamente");
  };
  
  // Función para generar Excel
  const generateExcel = () => {
    // Filtrar actividades según la selección actual
    const actividadesFiltradas = actividades.filter(act => 
      proyectoActual === "todos" || act.proyectoId === proyectoActual
    );
    
    // Filtrar ITRBs según la selección actual
    const itrbFiltrados = itrbItems.filter(itrb => {
      const actividad = actividades.find(act => act.id === itrb.actividadId);
      return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
    });
    
    // Crear libro Excel
    const wb = XLSX.utils.book_new();
    
    // Hoja de actividades
    const actividadesData = actividadesFiltradas.map(act => {
      const proyecto = proyectos.find(p => p.id === act.proyectoId);
      return {
        ID: act.id,
        Nombre: act.nombre,
        Sistema: act.sistema,
        Subsistema: act.subsistema,
        "Fecha Inicio": new Date(act.fechaInicio).toLocaleDateString('es-ES'),
        "Fecha Fin": new Date(act.fechaFin).toLocaleDateString('es-ES'),
        "Duración (días)": act.duracion,
        Proyecto: proyecto?.titulo || "N/A"
      };
    });
    
    const wsActividades = XLSX.utils.json_to_sheet(actividadesData);
    XLSX.utils.book_append_sheet(wb, wsActividades, "Actividades");
    
    // Hoja de ITR B
    const itrbData = itrbFiltrados.map(itrb => {
      const actividad = actividades.find(act => act.id === itrb.actividadId);
      const proyecto = actividad ? proyectos.find(p => p.id === actividad.proyectoId) : null;
      
      return {
        ID: itrb.id,
        Descripción: itrb.descripcion,
        Actividad: actividad?.nombre || "N/A",
        Sistema: actividad?.sistema || "N/A",
        Subsistema: actividad?.subsistema || "N/A",
        "Cantidad Realizada": itrb.cantidadRealizada,
        "Cantidad Total": itrb.cantidadTotal,
        "Progreso (%)": itrb.cantidadTotal > 0 ? (itrb.cantidadRealizada / itrb.cantidadTotal) * 100 : 0,
        Estado: itrb.estado,
        CCC: itrb.ccc ? "Sí" : "No",
        "Fecha Límite": new Date(itrb.fechaLimite).toLocaleDateString('es-ES'),
        Proyecto: proyecto?.titulo || "N/A",
        Observaciones: itrb.observaciones || ""
      };
    });
    
    const wsITRB = XLSX.utils.json_to_sheet(itrbData);
    XLSX.utils.book_append_sheet(wb, wsITRB, "ITR B");
    
    // Exportar Excel
    const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(wb, `plan_precomisionado_${currentDate}.xlsx`);
    toast.success("Excel generado exitosamente");
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Generador de Reportes</CardTitle>
        <CardDescription>
          Genere informes del plan de precomisionado
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Exportar datos</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Seleccione el formato en el que desea exportar los datos.
              Los reportes incluirán los datos filtrados según el proyecto actualmente seleccionado.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Button onClick={generatePDF} className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generar PDF
              </Button>
              <Button onClick={generateExcel} variant="outline" className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Generar Excel
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm">
              <p>El reporte incluirá la información del proyecto actualmente seleccionado.</p>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Vista previa</h3>
            <div className="p-4 border rounded bg-white dark:bg-slate-800">
              <div className="h-60 flex items-center justify-center">
                <div className="text-center opacity-70">
                  <FileText className="h-16 w-16 mx-auto mb-2 opacity-40" />
                  <p>El informe incluirá las actividades y ITR B del proyecto actual.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Para obtener una vista previa, haga clic en "Generar PDF".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
