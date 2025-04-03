
import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileText, LineChart, Image, FileSpreadsheet, AlertTriangle } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { OpcionesReporte } from "@/types";

const ReportGenerator: React.FC = () => {
  const { actividades, itrbItems, proyectos, proyectoActual, filtros, getKPIs } = useAppContext();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  
  const [opcionesReporte, setOpcionesReporte] = useState<OpcionesReporte>({
    incluirGantt: true,
    formatoGantt: "imagen",
    orientacion: "horizontal",
    incluirKPIs: true,
    incluirActividades: true,
    incluirITRB: true
  });
  
  // Function to find and capture the Gantt chart
  const captureGanttChart = async (): Promise<string | null> => {
    try {
      // Find all Gantt chart containers in the DOM
      const ganttContainers = Array.from(document.querySelectorAll('.gantt-chart-container'));
      const visibleGanttContainer = ganttContainers.find(el => 
        el instanceof HTMLElement && 
        el.offsetParent !== null && 
        window.getComputedStyle(el).display !== 'none'
      ) as HTMLElement;
      
      if (!visibleGanttContainer) {
        console.warn("No se pudo encontrar un diagrama de Gantt visible en el DOM");
        
        // Try to find the EnhancedGanttChart component as fallback
        const ganttElement = document.querySelector('.recharts-wrapper') as HTMLElement;
        if (!ganttElement) {
          return null;
        }
        
        const canvas = await html2canvas(ganttElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false
        });
        
        return canvas.toDataURL('image/png');
      }
      
      // Create a clone of the Gantt container to avoid modifying the original
      const clonedContainer = visibleGanttContainer.cloneNode(true) as HTMLElement;
      
      // Temporarily append to body but hide it
      clonedContainer.style.position = 'absolute';
      clonedContainer.style.left = '-9999px';
      clonedContainer.style.width = `${visibleGanttContainer.scrollWidth}px`;
      clonedContainer.style.height = `${visibleGanttContainer.scrollHeight}px`;
      document.body.appendChild(clonedContainer);
      
      // Capture full scrollable area including hidden parts
      const canvas = await html2canvas(clonedContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: visibleGanttContainer.scrollWidth,
        height: visibleGanttContainer.scrollHeight
      });
      
      // Remove the temporary element
      document.body.removeChild(clonedContainer);
      
      // Convert to image base64
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error al capturar el diagrama de Gantt:", error);
      toast.error("No se pudo capturar el diagrama de Gantt. Intente nuevamente.");
      return null;
    }
  };
  
  // Function to generate Gantt data for Excel export
  const generateGanttDataForExcel = () => {
    const ganttData = actividades.filter(act => 
      proyectoActual === "todos" || act.proyectoId === proyectoActual
    ).map(act => {
      const proyecto = proyectos.find(p => p.id === act.proyectoId);
      const itrbAsociados = itrbItems.filter(i => i.actividadId === act.id);
      const itrbCompletados = itrbAsociados.filter(i => i.estado === "Completado").length;
      const totalItrb = itrbAsociados.length;
      const avance = totalItrb > 0 ? Math.round((itrbCompletados / totalItrb) * 100) : 0;
      
      return {
        Proyecto: proyecto?.titulo || 'N/A',
        ID: act.id,
        Actividad: act.nombre,
        Sistema: act.sistema,
        Subsistema: act.subsistema,
        'Fecha Inicio': new Date(act.fechaInicio).toLocaleDateString('es-ES'),
        'Fecha Fin': new Date(act.fechaFin).toLocaleDateString('es-ES'),
        'Duración (días)': act.duracion,
        'ITRBs Completados': `${itrbCompletados}/${totalItrb}`,
        'Avance (%)': `${avance}%`,
        'Estado': avance === 100 ? 'Completado' : avance > 0 ? 'En curso' : 'No iniciado'
      };
    });
    
    return ganttData;
  };
  
  // Function to generate enhanced PDF with Gantt chart
  const generatePDF = async () => {
    try {
      setGeneratingReport(true);
      
      // Determine PDF orientation based on settings
      const orientation = opcionesReporte.orientacion === "horizontal" ? "landscape" : "portrait";
      const doc = new jsPDF({ orientation });
      
      const title = proyectoActual !== "todos" 
        ? `Plan de Precomisionado - ${proyectos.find(p => p.id === proyectoActual)?.titulo || 'Todos los proyectos'}`
        : "Plan de Precomisionado - Todos los proyectos";
      
      // Style configuration
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      doc.setFontSize(12);
      
      // Generation date
      const currentDate = new Date().toLocaleDateString('es-ES');
      doc.text(`Fecha de generación: ${currentDate}`, 14, 30);
      
      // Filter activities based on current selection
      const actividadesFiltradas = actividades.filter(act => 
        proyectoActual === "todos" || act.proyectoId === proyectoActual
      );
      
      // Filter ITRBs based on current selection
      const itrbFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
      });
      
      let yPos = 40;
      
      // Add KPIs section if enabled
      if (opcionesReporte.incluirKPIs) {
        // Get KPIs
        const kpis = getKPIs(proyectoActual !== "todos" ? proyectoActual : undefined);
        
        // Calculate additional statistics
        const totalActividades = actividadesFiltradas.length;
        const totalITRB = itrbFiltrados.length;
        const itrbCompletados = itrbFiltrados.filter(itrb => itrb.estado === "Completado").length;
        const itrbEnCurso = itrbFiltrados.filter(itrb => itrb.estado === "En curso").length;
        const itrbVencidos = itrbFiltrados.filter(itrb => {
          const fechaLimite = new Date(itrb.fechaLimite);
          const hoy = new Date();
          return itrb.estado === "Vencido" || fechaLimite < hoy;
        }).length;
        
        const porcentajeCompletado = totalITRB > 0 ? (itrbCompletados / totalITRB) * 100 : 0;
        
        // Calculate completed vs remaining expired ITRBs for reporting
        const itrbsVencidos = itrbFiltrados.filter(item => {
          const fechaLimite = new Date(item.fechaLimite);
          const hoy = new Date();
          return fechaLimite < hoy || item.estado === "Vencido";
        });
        
        const vencidosCompletados = itrbsVencidos.filter(item => item.estado === "Completado").length;
        const vencidosFaltantes = itrbsVencidos.filter(item => item.estado !== "Completado").length;
        
        doc.setFontSize(16);
        doc.text("Indicadores Clave de Desempeño (KPIs)", 14, yPos);
        
        // Enhanced KPIs table
        const kpisData = [
          ["Avance Físico", `${porcentajeCompletado.toFixed(1)}%`],
          ["Total de Actividades", `${totalActividades}`],
          ["Total de ITR B", `${totalITRB}`],
          ["ITR B Completados", `${itrbCompletados} (${porcentajeCompletado.toFixed(1)}%)`],
          ["ITR B En Curso", `${itrbEnCurso}`],
          ["ITR B Pendientes", `${totalITRB - itrbCompletados}/${totalITRB}`],
          ["ITR B Vencidos", `${itrbVencidos}`],
          ["-- Vencidos Completados", `${vencidosCompletados}`],
          ["-- Vencidos Pendientes", `${vencidosFaltantes}`],
          ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`]
        ];
        
        (doc as any).autoTable({
          startY: yPos + 5,
          head: [["Indicador", "Valor"]],
          body: kpisData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          alternateRowStyles: { fillColor: [240, 245, 255] }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Add Gantt chart if enabled
      if (opcionesReporte.incluirGantt) {
        // Check if we need to add a new page
        if (yPos > doc.internal.pageSize.getHeight() - 100) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.text("Diagrama de Gantt", 14, yPos);
        yPos += 10;
        
        if (opcionesReporte.formatoGantt === "imagen") {
          // Capture Gantt chart as image
          const ganttImageData = await captureGanttChart();
          
          if (ganttImageData) {
            // Calculate size maintaining aspect ratio
            const pageWidth = doc.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 28; // Margin of 14 on each side
            
            try {
              // Add Gantt chart image to PDF
              doc.addImage(ganttImageData, 'PNG', 14, yPos, imgWidth, imgWidth * 0.5);
              yPos += (imgWidth * 0.5) + 15;
            } catch (err) {
              console.error("Error al agregar imagen del diagrama de Gantt:", err);
              doc.setFontSize(12);
              doc.setTextColor(200, 0, 0);
              doc.text("No se pudo incluir el diagrama de Gantt", 14, yPos + 10);
              yPos += 20;
              doc.setTextColor(0, 0, 0);
            }
          } else {
            doc.setFontSize(12);
            doc.setTextColor(200, 0, 0);
            doc.text("No se pudo capturar el diagrama de Gantt", 14, yPos + 10);
            yPos += 20;
            doc.setTextColor(0, 0, 0);
          }
        } else {
          // Create a tabular representation of the Gantt data
          const ganttDataTable = actividadesFiltradas.map(act => {
            const proyecto = proyectos.find(p => p.id === act.proyectoId);
            const itrbCount = itrbItems.filter(i => i.actividadId === act.id).length;
            return [
              act.nombre,
              act.sistema,
              act.subsistema,
              new Date(act.fechaInicio).toLocaleDateString('es-ES'),
              new Date(act.fechaFin).toLocaleDateString('es-ES'),
              `${act.duracion} días`,
              proyecto?.titulo || 'N/A',
              `${itrbCount}`
            ];
          });
          
          (doc as any).autoTable({
            startY: yPos,
            head: [['Actividad', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración', 'Proyecto', 'ITRBs']],
            body: ganttDataTable,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
          });
          
          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      }
      
      // Add Activities section if enabled
      if (opcionesReporte.incluirActividades && actividadesFiltradas.length > 0) {
        // Check if we need to add a new page
        if (yPos > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPos = 20;
        }
        
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
      
      // Add ITRB section if enabled
      if (opcionesReporte.incluirITRB && itrbFiltrados.length > 0) {
        // Check if we need to add a new page
        if (yPos > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPos = 20;
        }
        
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
            itrb.mcc ? 'Sí' : 'No',
            new Date(itrb.fechaLimite).toLocaleDateString('es-ES')
          ];
        });
        
        (doc as any).autoTable({
          startY: yPos + 5,
          head: [['Descripción', 'Actividad', 'Sistema', 'Progreso', 'Estado', 'MCC', 'Fecha Límite']],
          body: itrbData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }
        });
      }
      
      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount} - Plan de Precomisionado v1.0.0`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
      
      // Save PDF
      doc.save(`plan_precomisionado_${currentDate.replace(/\//g, '-')}.pdf`);
      toast.success("PDF con diagrama de Gantt generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF. Por favor intente nuevamente.");
    } finally {
      setGeneratingReport(false);
    }
  };
  
  // Function to generate Excel with Gantt chart data
  const generateExcel = async () => {
    try {
      setGeneratingReport(true);
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Filter activities based on current selection
      const actividadesFiltradas = actividades.filter(act => 
        proyectoActual === "todos" || act.proyectoId === proyectoActual
      );
      
      // Filter ITRBs based on current selection
      const itrbFiltrados = itrbItems.filter(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
      });
      
      // Generate KPI data
      if (opcionesReporte.incluirKPIs) {
        // Calculate statistics
        const totalActividades = actividadesFiltradas.length;
        const totalITRB = itrbFiltrados.length;
        const itrbCompletados = itrbFiltrados.filter(itrb => itrb.estado === "Completado").length;
        const itrbEnCurso = itrbFiltrados.filter(itrb => itrb.estado === "En curso").length;
        const itrbVencidos = itrbFiltrados.filter(itrb => itrb.estado === "Vencido").length;
        const porcentajeCompletado = totalITRB > 0 ? (itrbCompletados / totalITRB) * 100 : 0;
        
        // Calculate expired ITRBs completed vs missing for reporting
        const itrbsVencidos = itrbFiltrados.filter(item => {
          const fechaLimite = new Date(item.fechaLimite);
          const hoy = new Date();
          return fechaLimite < hoy;
        });
        
        const vencidosCompletados = itrbsVencidos.filter(item => item.estado === "Completado").length;
        const vencidosFaltantes = itrbsVencidos.filter(item => item.estado !== "Completado").length;
        
        // Get KPIs
        const kpis = getKPIs(proyectoActual !== "todos" ? proyectoActual : undefined);
        
        // Summary sheet (KPIs)
        const resumenData = [
          ["PLAN DE PRECOMISIONADO - RESUMEN ESTADÍSTICO", "", ""],
          ["", "", ""],
          ["Estadística", "Valor", "Porcentaje"],
          ["Avance Físico", `${porcentajeCompletado.toFixed(1)}%`, ""],
          ["Total de Actividades", totalActividades.toString(), ""],
          ["Total de ITR B", totalITRB.toString(), ""],
          ["ITR B Completados", itrbCompletados.toString(), `${porcentajeCompletado.toFixed(2)}%`],
          ["ITR B Pendientes", (totalITRB - itrbCompletados).toString(), `${(100 - porcentajeCompletado).toFixed(2)}%`],
          ["ITR B En Curso", itrbEnCurso.toString(), (totalITRB > 0 ? (itrbEnCurso / totalITRB * 100).toFixed(2) : "0") + "%"],
          ["ITR B Vencidos", itrbVencidos.toString(), (totalITRB > 0 ? (itrbVencidos / totalITRB * 100).toFixed(2) : "0") + "%"],
          ["-- Vencidos Completados", vencidosCompletados.toString(), (itrbsVencidos.length > 0 ? (vencidosCompletados / itrbsVencidos.length * 100).toFixed(2) : "0") + "%"],
          ["-- Vencidos Pendientes", vencidosFaltantes.toString(), (itrbsVencidos.length > 0 ? (vencidosFaltantes / itrbsVencidos.length * 100).toFixed(2) : "0") + "%"],
          ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`, (kpis.totalSubsistemas > 0 ? (kpis.subsistemasMCC / kpis.totalSubsistemas * 100).toFixed(2) : "0") + "%"]
        ];
        
        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        
        // Style for title
        wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
        
        // Add sheet to workbook
        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
      }
      
      // Generate Gantt data if enabled
      if (opcionesReporte.incluirGantt) {
        // Create Gantt sheet with formatted data
        const ganttData = [
          ["DIAGRAMA DE GANTT - ACTIVIDADES"],
          [""],
          ["Proyecto", "ID", "Actividad", "Sistema", "Subsistema", "Fecha Inicio", "Fecha Fin", "Duración (días)", "ITRBs Completados", "Avance (%)", "Estado"]
        ];
        
        const ganttRows = generateGanttDataForExcel();
        ganttRows.forEach(row => {
          ganttData.push([
            row.Proyecto,
            row.ID,
            row.Actividad,
            row.Sistema,
            row.Subsistema,
            row["Fecha Inicio"],
            row["Fecha Fin"],
            row["Duración (días)"],
            row["ITRBs Completados"],
            row["Avance (%)"],
            row.Estado
          ]);
        });
        
        const wsGantt = XLSX.utils.aoa_to_sheet(ganttData);
        wsGantt['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
        XLSX.utils.book_append_sheet(wb, wsGantt, "Gantt");
      }
      
      // Generate activities sheet if enabled
      if (opcionesReporte.incluirActividades && actividadesFiltradas.length > 0) {
        // Activities sheet with advanced formatting
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
      }
      
      // Generate ITRB sheet if enabled
      if (opcionesReporte.incluirITRB && itrbFiltrados.length > 0) {
        // ITRB sheet with conditional formatting
        const itrbData = [
          ["LISTADO DE ITR B"],
          [""],
          ["ID", "Descripción", "Actividad", "Sistema", "Subsistema", "Realizado", "Total", "Progreso (%)", "Estado", "MCC", "Fecha Límite", "Proyecto", "Observaciones"]
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
            itrb.mcc ? "Sí" : "No",
            new Date(itrb.fechaLimite).toLocaleDateString('es-ES'),
            proyecto?.titulo || "N/A",
            itrb.observaciones || ""
          ]);
        });
        
        const wsITRB = XLSX.utils.aoa_to_sheet(itrbData);
        wsITRB['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];
        XLSX.utils.book_append_sheet(wb, wsITRB, "ITR B");
      }
      
      // Add raw data sheet for additional analysis
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
          "Tiene_MCC": itrb.mcc ? 1 : 0,
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
      
      // Export Excel
      const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      XLSX.writeFile(wb, `plan_precomisionado_${currentDate}.xlsx`);
      toast.success("Excel con datos de Gantt generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel. Por favor intente nuevamente.");
    } finally {
      setGeneratingReport(false);
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
            <h3 className="text-lg font-medium mb-4">Exportar Diagrama de Gantt</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Exporte el diagrama de Gantt actual en diferentes formatos. La exportación incluirá
              todas las actividades y la visualización actual del diagrama.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                onClick={generatePDF} 
                className="flex items-center gap-2"
                disabled={generatingReport}
              >
                <Image className="h-5 w-5" />
                Gantt en PDF
              </Button>
              <Button 
                onClick={generateExcel} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={generatingReport}
              >
                <FileSpreadsheet className="h-5 w-5" />
                Gantt en Excel
              </Button>
            </div>
            
            <div className="mt-6">
              <Button 
                variant="ghost" 
                onClick={() => setOptionsExpanded(!optionsExpanded)}
                className="text-sm"
              >
                {optionsExpanded ? "Ocultar opciones" : "Mostrar opciones avanzadas"}
              </Button>
              
              {optionsExpanded && (
                <div className="mt-4 space-y-4 p-4 border rounded-md bg-white dark:bg-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="incluirGantt" 
                        checked={opcionesReporte.incluirGantt}
                        onCheckedChange={(checked) => 
                          setOpcionesReporte({...opcionesReporte, incluirGantt: checked as boolean})
                        }
                      />
                      <Label htmlFor="incluirGantt">Incluir diagrama de Gantt</Label>
                    </div>
                    
                    {opcionesReporte.incluirGantt && (
                      <div className="ml-6 mt-2">
                        <div className="space-y-2">
                          <Label htmlFor="formatoGantt">Formato del Gantt</Label>
                          <Select
                            value={opcionesReporte.formatoGantt}
                            onValueChange={(value: "imagen" | "tabla") => 
                              setOpcionesReporte({...opcionesReporte, formatoGantt: value})
                            }
                          >
                            <SelectTrigger id="formatoGantt">
                              <SelectValue placeholder="Seleccionar formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="imagen">Como imagen</SelectItem>
                              <SelectItem value="tabla">Como tabla de datos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="incluirKPIs" 
                        checked={opcionesReporte.incluirKPIs}
                        onCheckedChange={(checked) => 
                          setOpcionesReporte({...opcionesReporte, incluirKPIs: checked as boolean})
                        }
                      />
                      <Label htmlFor="incluirKPIs">Incluir KPIs y estadísticas</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="incluirActividades" 
                        checked={opcionesReporte.incluirActividades}
                        onCheckedChange={(checked) => 
                          setOpcionesReporte({...opcionesReporte, incluirActividades: checked as boolean})
                        }
                      />
                      <Label htmlFor="incluirActividades">Incluir listado de actividades</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="incluirITRB" 
                        checked={opcionesReporte.incluirITRB}
                        onCheckedChange={(checked) => 
                          setOpcionesReporte({...opcionesReporte, incluirITRB: checked as boolean})
                        }
                      />
                      <Label htmlFor="incluirITRB">Incluir listado de ITR B</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orientacion">Orientación del documento</Label>
                    <Select
                      value={opcionesReporte.orientacion}
                      onValueChange={(value: "vertical" | "horizontal") => 
                        setOpcionesReporte({...opcionesReporte, orientacion: value})
                      }
                    >
                      <SelectTrigger id="orientacion">
                        <SelectValue placeholder="Seleccionar orientación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal (Landscape)</SelectItem>
                        <SelectItem value="vertical">Vertical (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      La orientación horizontal es mejor para visualizar el diagrama de Gantt
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="font-medium">Nota importante</p>
              </div>
              <p className="mt-1">Para obtener los mejores resultados al exportar el diagrama de Gantt:</p>
              <ul className="list-disc list-inside mt-1 ml-2">
                <li>Asegúrese de que el diagrama está visible en la pantalla</li>
                <li>Ajuste el tamaño del diagrama antes de exportar para mejor visualización</li>
                <li>El formato de imagen captura exactamente lo que ve en pantalla</li>
                <li>El formato de tabla incluye todos los datos pero sin visualización gráfica</li>
              </ul>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Exportar datos completos</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Genere reportes completos con toda la información del plan de precomisionado.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                onClick={generatePDF} 
                className="flex items-center gap-2"
                disabled={generatingReport}
              >
                <Download className="h-5 w-5" />
                Reporte Completo PDF
              </Button>
              <Button 
                onClick={generateExcel} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={generatingReport}
              >
                <FileText className="h-5 w-5" />
                Reporte Completo Excel
              </Button>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Vista previa</h3>
            <div className="p-4 border rounded bg-white dark:bg-slate-800">
              <div className="h-60 flex items-center justify-center">
                <div className="text-center opacity-70">
                  <LineChart className="h-16 w-16 mx-auto mb-2 opacity-40" />
                  <p>El informe incluirá:</p>
                  <ul className="list-disc list-inside text-left max-w-md mx-auto mt-2">
                    <li>Diagrama de Gantt con todas las actividades</li>
                    <li>Resumen con KPIs completos (avance, ITR completados, pendientes, vencidos)</li>
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
