
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { FiltrosDashboard } from "@/types";

interface ExportUtilsProps {
  proyectos: any[];
  actividades: any[];
  itrbItems: any[];
  getKPIs: (proyectoId?: string) => any;
}

export const useExportUtils = ({
  proyectos, 
  actividades, 
  itrbItems, 
  getKPIs
}: ExportUtilsProps) => {
  const captureGanttChart = async (): Promise<string | null> => {
    try {
      const ganttContainers = Array.from(document.querySelectorAll('.gantt-chart-container'));
      const visibleGanttContainer = ganttContainers.find(el =>
        el instanceof HTMLElement &&
        el.offsetParent !== null &&
        window.getComputedStyle(el).display !== 'none'
      ) as HTMLElement;

      if (!visibleGanttContainer) {
        const ganttElement = document.querySelector('.recharts-wrapper') as HTMLElement;
        if (!ganttElement) {
          toast.error("No se pudo encontrar el diagrama de Gantt para exportar");
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

      const timestamp = document.createElement('div');
      timestamp.className = 'chart-timestamp';
      timestamp.style.position = 'absolute';
      timestamp.style.bottom = '10px';
      timestamp.style.right = '10px';
      timestamp.style.fontSize = '10px';
      timestamp.style.color = '#666';
      timestamp.style.padding = '4px';
      timestamp.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      timestamp.style.borderRadius = '3px';

      const userName = localStorage.getItem('userName') || 'Usuario';
      timestamp.textContent = `Generado por: ${userName} - ${new Date().toLocaleString()}`;

      visibleGanttContainer.appendChild(timestamp);

      const canvas = await html2canvas(visibleGanttContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: visibleGanttContainer.scrollWidth,
        height: visibleGanttContainer.scrollHeight
      });

      visibleGanttContainer.removeChild(timestamp);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error al capturar el diagrama de Gantt:", error);
      toast.error("No se pudo capturar el diagrama de Gantt. Intente nuevamente.");
      return null;
    }
  };

  const generateGanttDataForExcel = (filtros: FiltrosDashboard) => {
    const ganttData = actividades.filter(act =>
      filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
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

  const generarPDF = async (filtros: FiltrosDashboard) => {
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      await import('jspdf-autotable');

      const ganttImageData = await captureGanttChart();
      if (!ganttImageData) {
        toast.error("No se pudo capturar el diagrama de Gantt");
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm"
      });

      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Dashboard - Plan de Precomisionado", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const userName = localStorage.getItem('userName') || 'Usuario';
      doc.text(`Generado por: ${userName}`, 14, 30);
      doc.text("Fecha: " + new Date().toLocaleDateString('es-ES') + " " + new Date().toLocaleTimeString('es-ES'), 14, 35);

      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);

      const proyectoNombre = filtros.proyecto !== "todos" ?
        proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos" :
        "Todos los proyectos";

      doc.text(`Proyecto: ${proyectoNombre}`, 14, 40);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 28;
      const imgHeight = imgWidth * 0.5;

      try {
        doc.addImage(ganttImageData, 'PNG', 14, 45, imgWidth, imgHeight);
      } catch (err) {
        console.error("Error al agregar imagen del diagrama de Gantt:", err);
        doc.text("Error al incluir el diagrama de Gantt", 14, 45);
      }

      const kpisData = [
        ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
        ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
        ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`],
        ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
      ];

      (doc as any).autoTable({
        startY: 45 + imgHeight + 10,
        head: [["Indicador", "Valor"]],
        body: kpisData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });

      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount} - Plan de Precomisionado - Generado: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save("gantt-chart-precomisionado.pdf");
      toast.success("PDF del diagrama de Gantt generado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF: " + (error instanceof Error ? error.message : "Error desconocido"));
      return false;
    }
  };

  const generarExcel = async (filtros: FiltrosDashboard) => {
    try {
      const wb = XLSX.utils.book_new();

      const ganttData = generateGanttDataForExcel(filtros);

      const wsData = [
        ["DIAGRAMA DE GANTT - PLAN DE PRECOMISIONADO", "", "", "", "", "", "", "", "", ""],
        ["Proyecto: " + (filtros.proyecto !== "todos" ?
          proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos" :
          "Todos los proyectos"), "", "", "", "", "", "", "", "", ""],
        ["Fecha de exportación: " + new Date().toLocaleDateString('es-ES'), "", "", "", "", "", "", "", "", ""],
        [""],
        ["Proyecto", "ID", "Actividad", "Sistema", "Subsistema", "Fecha Inicio", "Fecha Fin", "Duración (días)", "ITRBs Completados", "Avance (%)", "Estado"]
      ];

      ganttData.forEach(row => {
        wsData.push([
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

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const colWidths = [
        { wch: 20 },
        { wch: 10 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 }
      ];

      ws['!cols'] = colWidths;
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Gantt Chart");

      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);

      const kpisData = [
        ["KPIs - PLAN DE PRECOMISIONADO", ""],
        [""],
        ["Indicador", "Valor"],
        ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
        ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
        ["ITR B Completados (%)", `${kpis.totalITRB > 0 ? ((kpis.realizadosITRB / kpis.totalITRB) * 100).toFixed(1) : 0}%`],
        ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`],
        ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
      ];

      const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
      wsKPIs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      XLSX.utils.book_append_sheet(wb, wsKPIs, "KPIs");

      XLSX.writeFile(wb, "gantt-chart-precomisionado.xlsx");
      toast.success("Excel del diagrama de Gantt generado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel");
      return false;
    }
  };

  return {
    captureGanttChart,
    generateGanttDataForExcel,
    generarPDF,
    generarExcel
  };
};
