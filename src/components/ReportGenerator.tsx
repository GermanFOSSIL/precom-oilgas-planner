
import React, { useState } from "react";
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
    try {
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
        ["ITR B Pendientes", `${totalITRB - itrbCompletados}/${totalITRB}`],
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
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF. Por favor intente nuevamente.");
    }
  };
  
  // Función para generar Excel mejorada
  const generateExcel = () => {
    try {
      // Filtrar actividades según la selección actual
      const actividadesFiltradas = actividades.filter(act => 
        proyectoActual === "todos" || act.proyectoId === proyectoActual
      );
      
      // Filtrar ITRBs según la selección actual
      const itrbFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
      });
      
      // Calcular estadísticas
      const totalActividades = actividadesFiltradas.length;
      const totalITRB = itrbFiltrados.length;
      const itrbCompletados = itrbFiltrados.filter(itrb => itrb.estado === "Completado").length;
      const itrbEnCurso = itrbFiltrados.filter(itrb => itrb.estado === "En curso").length;
      const itrbVencidos = itrbFiltrados.filter(itrb => itrb.estado === "Vencido").length;
      const porcentajeCompletado = totalITRB > 0 ? (itrbCompletados / totalITRB) * 100 : 0;
      
      // Crear libro Excel
      const wb = XLSX.utils.book_new();
      
      // 1. Hoja de Resumen (KPIs)
      const resumenData = [
        ["PLAN DE PRECOMISIONADO - RESUMEN ESTADÍSTICO", "", ""],
        ["", "", ""],
        ["Estadística", "Valor", "Porcentaje"],
        ["Total de Actividades", totalActividades.toString(), ""],
        ["Total de ITR B", totalITRB.toString(), ""],
        ["ITR B Completados", itrbCompletados.toString(), `${porcentajeCompletado.toFixed(2)}%`],
        ["ITR B Pendientes", (totalITRB - itrbCompletados).toString(), `${(100 - porcentajeCompletado).toFixed(2)}%`],
        ["ITR B En Curso", itrbEnCurso.toString(), (totalITRB > 0 ? (itrbEnCurso / totalITRB * 100).toFixed(2) : "0") + "%"],
        ["ITR B Vencidos", itrbVencidos.toString(), (totalITRB > 0 ? (itrbVencidos / totalITRB * 100).toFixed(2) : "0") + "%"]
      ];
      
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      
      // Estilo para el título
      wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
      
      // 2. Hoja de actividades con formato avanzado
      const actividadesData = [
        ["LISTADO DE ACTIVIDADES"], 
        [""],
        ["ID", "Nombre", "Sistema", "Subsistema", "Fecha Inicio", "Fecha Fin", "Duración (días)", "Proyecto"]
      ];
      
      actividadesFiltradas.forEach(act => {
        const proyecto = proyectos.find(p => p.id === act.proyectoId);
        actividadesData.push([
          act.id,
          act.nombre,
          act.sistema,
          act.subsistema,
          new Date(act.fechaInicio).toLocaleDateString('es-ES'),
          new Date(act.fechaFin).toLocaleDateString('es-ES'),
          act.duracion.toString(),
          proyecto?.titulo || "N/A"
        ]);
      });
      
      const wsActividades = XLSX.utils.aoa_to_sheet(actividadesData);
      wsActividades['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      XLSX.utils.book_append_sheet(wb, wsActividades, "Actividades");
      
      // 3. Hoja de ITR B con formato condicional
      const itrbData = [
        ["LISTADO DE ITR B"],
        [""],
        ["ID", "Descripción", "Actividad", "Sistema", "Subsistema", "Realizado", "Total", "Progreso (%)", "Estado", "CCC", "Fecha Límite", "Proyecto", "Observaciones"]
      ];
      
      itrbFiltrados.forEach(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        const proyecto = actividad ? proyectos.find(p => p.id === actividad.proyectoId) : null;
        const progreso = itrb.cantidadTotal > 0 ? (itrb.cantidadRealizada / itrb.cantidadTotal) * 100 : 0;
        
        itrbData.push([
          itrb.id,
          itrb.descripcion,
          actividad?.nombre || "N/A",
          actividad?.sistema || "N/A",
          actividad?.subsistema || "N/A",
          itrb.cantidadRealizada.toString(),
          itrb.cantidadTotal.toString(),
          progreso.toFixed(1),
          itrb.estado,
          itrb.ccc ? "Sí" : "No",
          new Date(itrb.fechaLimite).toLocaleDateString('es-ES'),
          proyecto?.titulo || "N/A",
          itrb.observaciones || ""
        ]);
      });
      
      const wsITRB = XLSX.utils.aoa_to_sheet(itrbData);
      wsITRB['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];
      XLSX.utils.book_append_sheet(wb, wsITRB, "ITR B");
      
      // 4. Hoja de datos crudos para análisis adicionales
      const datosData = itrbFiltrados.map(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        const proyecto = actividad ? proyectos.find(p => p.id === actividad.proyectoId) : null;
        
        return {
          "ID_ITR": itrb.id,
          "Descripcion": itrb.descripcion,
          "ID_Actividad": itrb.actividadId,
          "Actividad": actividad?.nombre || "N/A",
          "Sistema": actividad?.sistema || "N/A",
          "Subsistema": actividad?.subsistema || "N/A",
          "Cantidad_Realizada": itrb.cantidadRealizada,
          "Cantidad_Total": itrb.cantidadTotal,
          "Progreso_Porcentaje": itrb.cantidadTotal > 0 ? (itrb.cantidadRealizada / itrb.cantidadTotal) * 100 : 0,
          "Estado": itrb.estado,
          "Tiene_CCC": itrb.ccc ? 1 : 0,
          "Fecha_Limite": new Date(itrb.fechaLimite).toISOString(),
          "ID_Proyecto": actividad?.proyectoId || "",
          "Proyecto": proyecto?.titulo || "N/A",
          "Observaciones": itrb.observaciones || "",
          "Vencido": itrb.estado === "Vencido" ? 1 : 0,
          "Completado": itrb.estado === "Completado" ? 1 : 0
        };
      });
      
      const wsDatos = XLSX.utils.json_to_sheet(datosData);
      XLSX.utils.book_append_sheet(wb, wsDatos, "Datos");
      
      // Exportar Excel
      const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      XLSX.writeFile(wb, `plan_precomisionado_${currentDate}.xlsx`);
      toast.success("Excel generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel. Por favor intente nuevamente.");
    }
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
              <Button onClick={generateExcel} className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Generar Excel
              </Button>
              <Button onClick={generatePDF} variant="outline" className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generar PDF
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm">
              <p>El reporte Excel incluirá datos crudos, KPIs y listados detallados de actividades e ITR-B.</p>
              <p className="mt-1">La exportación en PDF ofrece un informe resumido para impresión.</p>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Vista previa</h3>
            <div className="p-4 border rounded bg-white dark:bg-slate-800">
              <div className="h-60 flex items-center justify-center">
                <div className="text-center opacity-70">
                  <FileText className="h-16 w-16 mx-auto mb-2 opacity-40" />
                  <p>El informe incluirá:</p>
                  <ul className="list-disc list-inside text-left max-w-md mx-auto mt-2">
                    <li>Resumen con KPIs (ITR completados, pendientes, vencidos)</li>
                    <li>Listado de actividades por proyecto/sistema</li>
                    <li>Estado detallado de cada ITR-B</li>
                    <li>Datos crudos para análisis personalizados (solo Excel)</li>
                  </ul>
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
