import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { Actividad, ITRB, Proyecto, FiltrosDashboard } from "@/types";

interface KPIItem {
  titulo: string;
  valor: string | number;
  descripcion: string;
}

interface ExportUtilsProps {
  proyectos: Proyecto[];
  actividades: Actividad[];
  itrbItems: ITRB[];
  getKPIs?: (proyectoId?: string) => KPIItem[];
}

export const useExportUtils = ({
  proyectos,
  actividades,
  itrbItems,
  getKPIs,
}: ExportUtilsProps) => {
  const [exporting, setExporting] = useState(false);

  const captureGanttChart = useCallback(async () => {
    const ganttElement = document.querySelector(".gantt-chart-container");
    if (!ganttElement) {
      console.error("No se encontró el elemento del gráfico Gantt");
      throw new Error("No se encontró el gráfico Gantt para exportar");
    }
    
    if (!(ganttElement instanceof HTMLElement)) {
      console.error("El elemento del gráfico Gantt no es un HTMLElement válido");
      throw new Error("Elemento de gráfico Gantt no válido");
    }
    
    const originalScroll = ganttElement.scrollTop;
    ganttElement.scrollTop = 0;
    
    try {
      const canvas = await html2canvas(ganttElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      
      const imageData = canvas.toDataURL("image/png");
      
      ganttElement.scrollTop = originalScroll;
      
      return imageData;
    } catch (error) {
      console.error("Error al capturar el gráfico Gantt:", error);
      ganttElement.scrollTop = originalScroll;
      throw new Error("Error al capturar el gráfico Gantt");
    }
  }, []);

  const generarPDF = useCallback(
    async (filtros: FiltrosDashboard) => {
      try {
        setExporting(true);
        toast.info("Generando PDF, espere un momento...");

        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        const proyectoSeleccionado =
          filtros.proyecto !== "todos"
            ? proyectos.find((p) => p.id === filtros.proyecto)?.titulo || "Todos los proyectos"
            : "Todos los proyectos";

        const title = `Plan de Precomisionado - ${proyectoSeleccionado}`;
        const subTitle = `Generado el ${format(new Date(), "PPpp", { locale: es })}`;

        doc.setFontSize(20);
        doc.text(title, 15, 15);
        doc.setFontSize(12);
        doc.text(subTitle, 15, 25);

        try {
          const ganttImage = await captureGanttChart();
          
          const imgWidth = doc.internal.pageSize.getWidth() - 30;
          const imgHeight = 100;
          
          doc.addImage(ganttImage, "PNG", 15, 35, imgWidth, imgHeight);
          
          doc.setLineWidth(0.5);
          doc.line(15, 145, 280, 145);
          doc.setFontSize(14);
          doc.text("Listado de ITRs", 15, 155);
        } catch (error) {
          console.error("Error al añadir el gráfico Gantt al PDF:", error);
          doc.setFontSize(14);
          doc.setTextColor(255, 0, 0);
          doc.text("Error al generar el gráfico Gantt", 15, 40);
          doc.setTextColor(0, 0, 0);
        }

        const filteredITRs = itrbItems.filter((itrb) => {
          if (filtros.proyecto !== "todos") {
            const actividad = actividades.find((a) => a.id === itrb.actividadId);
            if (!actividad || actividad.proyectoId !== filtros.proyecto) {
              return false;
            }
          }

          const actividad = actividades.find((a) => a.id === itrb.actividadId);
          if (!actividad) return false;

          if (filtros.sistema && actividad.sistema !== filtros.sistema) {
            return false;
          }

          if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
            return false;
          }

          if (filtros.busquedaActividad) {
            const searchTerm = filtros.busquedaActividad.toLowerCase();
            const descripcion = itrb.descripcion.toLowerCase();
            if (!descripcion.includes(searchTerm)) {
              return false;
            }
          }

          if (filtros.estadoITRB && itrb.estado !== filtros.estadoITRB) {
            return false;
          }

          return true;
        });

        const tableColumn = ["ID", "Descripción", "Sistema", "Subsistema", "Estado", "Fecha Límite"];
        const tableRows = filteredITRs.map((itrb) => {
          const actividad = actividades.find((a) => a.id === itrb.actividadId);
          return [
            itrb.id,
            itrb.descripcion,
            actividad?.sistema || "-",
            actividad?.subsistema || "-",
            itrb.estado || "-",
            itrb.fechaLimite
              ? format(new Date(itrb.fechaLimite), "dd/MM/yyyy")
              : "-",
          ];
        });

        (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 160,
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        const pageCount = (doc as any).internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `Página ${i} de ${pageCount} - Generado por Fossil Energy`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        }

        const fileName = `plan_precomisionado_${format(new Date(), "yyyy-MM-dd_HHmmss")}.pdf`;
        doc.save(fileName);

        toast.success("PDF generado correctamente");
      } catch (error) {
        console.error("Error al generar PDF:", error);
        toast.error("Error al generar el PDF. Por favor, inténtelo de nuevo.");
      } finally {
        setExporting(false);
      }
    },
    [proyectos, actividades, itrbItems, captureGanttChart]
  );

  const generarExcel = useCallback(
    async (filtros: FiltrosDashboard) => {
      try {
        setExporting(true);
        toast.info("Generando Excel, espere un momento...");

        const filteredITRs = itrbItems.filter((itrb) => {
          if (filtros.proyecto !== "todos") {
            const actividad = actividades.find((a) => a.id === itrb.actividadId);
            if (!actividad || actividad.proyectoId !== filtros.proyecto) {
              return false;
            }
          }

          const actividad = actividades.find((a) => a.id === itrb.actividadId);
          if (!actividad) return false;

          if (filtros.sistema && actividad.sistema !== filtros.sistema) {
            return false;
          }

          if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
            return false;
          }

          if (filtros.busquedaActividad) {
            const searchTerm = filtros.busquedaActividad.toLowerCase();
            const descripcion = itrb.descripcion.toLowerCase();
            if (!descripcion.includes(searchTerm)) {
              return false;
            }
          }

          if (filtros.estadoITRB && itrb.estado !== filtros.estadoITRB) {
            return false;
          }

          return true;
        });

        const excelData = filteredITRs.map((itrb) => {
          const actividad = actividades.find((a) => a.id === itrb.actividadId);
          return {
            ID: itrb.id,
            Descripción: itrb.descripcion,
            Sistema: actividad?.sistema || "-",
            Subsistema: actividad?.subsistema || "-",
            Estado: itrb.estado || "-",
            "Fecha Inicio": itrb.fechaInicio
              ? format(new Date(itrb.fechaInicio), "dd/MM/yyyy")
              : "-",
            "Fecha Límite": itrb.fechaLimite
              ? format(new Date(itrb.fechaLimite), "dd/MM/yyyy")
              : "-",
          };
        });

        let kpisData: any[] = [];
        if (getKPIs) {
          const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
          kpisData = kpis.map((kpi) => ({
            Indicador: kpi.titulo,
            Valor: kpi.valor,
            Descripción: kpi.descripcion,
          }));
        }

        const workbook = XLSX.utils.book_new();

        const itrsSheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(workbook, itrsSheet, "ITRs");

        if (kpisData.length > 0) {
          const kpisSheet = XLSX.utils.json_to_sheet(kpisData);
          XLSX.utils.book_append_sheet(workbook, kpisSheet, "KPIs");
        }

        const infoData = [
          { Información: "Informe generado", Valor: format(new Date(), "PPpp", { locale: es }) },
          { Información: "Proyecto", 
            Valor: filtros.proyecto !== "todos" 
              ? proyectos.find((p) => p.id === filtros.proyecto)?.titulo || "-" 
              : "Todos los proyectos" },
          { Información: "Sistema", Valor: filtros.sistema || "Todos" },
          { Información: "Subsistema", Valor: filtros.subsistema || "Todos" },
          { Información: "Total ITRs", Valor: filteredITRs.length },
        ];
        const infoSheet = XLSX.utils.json_to_sheet(infoData);
        XLSX.utils.book_append_sheet(workbook, infoSheet, "Información");

        const fileName = `plan_precomisionado_${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toast.success("Excel generado correctamente");
      } catch (error) {
        console.error("Error al generar Excel:", error);
        toast.error("Error al generar el archivo Excel. Por favor, inténtelo de nuevo.");
      } finally {
        setExporting(false);
      }
    },
    [proyectos, actividades, itrbItems, getKPIs]
  );

  return {
    generarPDF,
    generarExcel,
    exporting,
  };
};
