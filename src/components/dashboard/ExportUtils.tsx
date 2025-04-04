
import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { Actividad, ITRB, Proyecto, FiltrosDashboard, KPIs } from "@/types";

interface ExportUtilsProps {
  proyectos: Proyecto[];
  actividades: Actividad[];
  itrbItems: ITRB[];
  getKPIs?: (proyectoId?: string) => any[];
}

export const useExportUtils = ({
  proyectos,
  actividades,
  itrbItems,
  getKPIs,
}: ExportUtilsProps) => {
  const [exporting, setExporting] = useState(false);

  // Captura el gráfico Gantt como imagen para el PDF
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
    
    // Scroll interno para asegurar que se captura todo el contenido
    const originalScroll = ganttElement.scrollTop;
    ganttElement.scrollTop = 0;
    
    try {
      // Mejoramos la calidad de la imagen para el PDF
      const canvas = await html2canvas(ganttElement, {
        scale: 2, // Mejor resolución
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      
      const imageData = canvas.toDataURL("image/png");
      
      // Restauramos el scroll
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

        // Crear nuevo documento PDF
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        }) as any; // Using any to avoid TypeScript errors with jsPDF extensions

        // Título
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

        // Capturar y añadir el gráfico Gantt
        try {
          const ganttImage = await captureGanttChart();
          
          // Ajustar tamaño para que quepa en la página
          const imgWidth = doc.internal.pageSize.getWidth() - 30;
          const imgHeight = 100; // Altura fija para el gráfico
          
          doc.addImage(ganttImage, "PNG", 15, 35, imgWidth, imgHeight);
          
          // Añadir línea separadora
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

        // Filtrar ITRs según filtros activos
        const filteredITRs = itrbItems.filter((itrb) => {
          // Aplicar filtro de proyecto
          if (filtros.proyecto !== "todos") {
            const actividad = actividades.find((a) => a.id === itrb.actividadId);
            if (!actividad || actividad.proyectoId !== filtros.proyecto) {
              return false;
            }
          }

          // Buscar actividad relacionada
          const actividad = actividades.find((a) => a.id === itrb.actividadId);
          if (!actividad) return false;

          // Aplicar filtro de sistema
          if (filtros.sistema && actividad.sistema !== filtros.sistema) {
            return false;
          }

          // Aplicar filtro de subsistema
          if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
            return false;
          }

          // Aplicar búsqueda (case insensitive)
          if (filtros.busquedaActividad) {
            const searchTerm = filtros.busquedaActividad.toLowerCase();
            const descripcion = itrb.descripcion.toLowerCase();
            if (!descripcion.includes(searchTerm)) {
              return false;
            }
          }

          // Estado ITR
          if (filtros.estadoITRB && itrb.estado !== filtros.estadoITRB) {
            return false;
          }

          return true;
        });

        // Añadir tabla de ITRs
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

        // Create table with autoTable plugin
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 160,
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        // Add footer information
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          // Page footer
          doc.setFontSize(10);
          doc.text(
            `Página ${i} de ${pageCount} - Generado por Fossil Energy`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        }

        // Save the file
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

        // Filtrar ITRs según filtros
        const filteredITRs = itrbItems.filter((itrb) => {
          // Aplicar filtro de proyecto
          if (filtros.proyecto !== "todos") {
            const actividad = actividades.find((a) => a.id === itrb.actividadId);
            if (!actividad || actividad.proyectoId !== filtros.proyecto) {
              return false;
            }
          }

          // Buscar actividad relacionada
          const actividad = actividades.find((a) => a.id === itrb.actividadId);
          if (!actividad) return false;

          // Aplicar filtro de sistema
          if (filtros.sistema && actividad.sistema !== filtros.sistema) {
            return false;
          }

          // Aplicar filtro de subsistema
          if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
            return false;
          }

          // Aplicar búsqueda (case insensitive)
          if (filtros.busquedaActividad) {
            const searchTerm = filtros.busquedaActividad.toLowerCase();
            const descripcion = itrb.descripcion.toLowerCase();
            if (!descripcion.includes(searchTerm)) {
              return false;
            }
          }

          // Estado ITR
          if (filtros.estadoITRB && itrb.estado !== filtros.estadoITRB) {
            return false;
          }

          return true;
        });

        // Preparar datos para Excel
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

        // Preparar KPIs
        let kpisData: any[] = [];
        if (getKPIs) {
          const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
          kpisData = kpis.map((kpi) => ({
            Indicador: kpi.titulo,
            Valor: kpi.valor,
            Descripción: kpi.descripcion,
          }));
        }

        // Crear libro de Excel y añadir hojas
        const workbook = XLSX.utils.book_new();

        // Hoja de ITRs
        const itrsSheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(workbook, itrsSheet, "ITRs");

        // Hoja de KPIs
        if (kpisData.length > 0) {
          const kpisSheet = XLSX.utils.json_to_sheet(kpisData);
          XLSX.utils.book_append_sheet(workbook, kpisSheet, "KPIs");
        }

        // Hoja de información
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

        // Guardar archivo
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
