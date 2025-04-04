
import { useCallback } from "react";
import { toast } from "sonner";
import { saveAs } from 'file-saver';
import { FiltrosDashboard } from "@/types";

interface ExportUtilsProps {
  proyectos: any[];
  actividades: any[];
  itrbItems: any[];
  getKPIs: any;
}

export const useExportUtils = ({ proyectos, actividades, itrbItems, getKPIs }: ExportUtilsProps) => {
  
  const generarPDF = useCallback(async (filtros: FiltrosDashboard) => {
    try {
      toast.info("Preparando exportación a PDF...");
      
      // Buscamos el elemento del gráfico Gantt
      const ganttEl = document.querySelector('.gantt-chart-container');
      
      if (!ganttEl) {
        toast.error("No se pudo encontrar el gráfico Gantt para exportar");
        return;
      }

      // Importamos las librerías dinámicamente
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      
      const Html2Canvas = html2canvas.default;
      const JsPDF = jsPDF.default;
      
      // Mejorado: Esperamos a que el DOM esté completamente listo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Notificación de progreso
      toast.info("Capturando imagen del gráfico...");
      
      // Mejorado: Capturar elemento completo del Gantt con mejor calidad y configuración
      const canvas = await Html2Canvas(ganttEl as HTMLElement, {
        scale: 2, // Mayor calidad (aumentado de 1.5 a 2)
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: ganttEl.scrollWidth || window.innerWidth,
        windowHeight: ganttEl.scrollHeight || window.innerHeight,
        logging: false,
        onclone: (clonedDoc) => {
          // Aseguramos que el elemento clonado tenga el tamaño correcto
          const clonedGantt = clonedDoc.querySelector('.gantt-chart-container');
          if (clonedGantt) {
            (clonedGantt as HTMLElement).style.width = `${ganttEl.scrollWidth}px`;
            (clonedGantt as HTMLElement).style.height = `${ganttEl.scrollHeight}px`;
          }
        }
      });
      
      // Dimensiones de la imagen
      const imgWidth = 270; // A4 landscape width (297mm) con margen
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Crear PDF (orientación horizontal para gráficos Gantt)
      const pdf = new JsPDF('landscape', 'mm', 'a4');
      
      // Título del proyecto
      let tituloProyecto = "Todos los proyectos";
      if (filtros.proyecto !== "todos") {
        const proyecto = proyectos.find(p => p.id === filtros.proyecto);
        if (proyecto) tituloProyecto = proyecto.titulo;
      }
      
      // Añadir título
      pdf.setFontSize(16);
      pdf.text(`Plan de Precomisionado - ${tituloProyecto}`, 14, 15);
      
      // Añadir fecha de generación
      pdf.setFontSize(10);
      pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 23);
      
      // Añadir filtros aplicados si hay
      const filtrosAplicados = [];
      if (filtros.sistema) filtrosAplicados.push(`Sistema: ${filtros.sistema}`);
      if (filtros.subsistema) filtrosAplicados.push(`Subsistema: ${filtros.subsistema}`);
      if (filtros.estadoITRB) filtrosAplicados.push(`Estado: ${filtros.estadoITRB}`);
      if (filtros.busquedaActividad) filtrosAplicados.push(`Búsqueda: ${filtros.busquedaActividad}`);
      
      if (filtros.itrFilter) filtrosAplicados.push(`ITR: ${filtros.itrFilter}`);
      
      if (filtrosAplicados.length > 0) {
        pdf.text(`Filtros: ${filtrosAplicados.join(', ')}`, 14, 28);
      }
      
      // KPIs resumidos
      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
      
      // Añadir KPIs al PDF
      pdf.setFontSize(12);
      pdf.text("Indicadores:", 14, 35);
      
      pdf.setFontSize(10);
      pdf.text(`Progreso ITRs: ${kpis.avanceFisico.toFixed(1)}%`, 14, 40);
      pdf.text(`ITRs activos: ${kpis.totalITRB - kpis.realizadosITRB}`, 14, 45);
      pdf.text(`ITRs vencidos: ${kpis.actividadesVencidas}`, 14, 50);
      
      // Añadir imagen al PDF con mejor calidad
      toast.info("Generando PDF con el gráfico...");
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0), // Máxima calidad de imagen
        'JPEG', 
        14, 55, 
        imgWidth, 
        imgHeight
      );
      
      // Logo y datos de la empresa
      pdf.setFontSize(8);
      pdf.text("Fossil Energy", 14, 200);
      pdf.text("Plan de Precomisionado - v1.0", 250, 200);
      
      // Guardar PDF
      pdf.save(`plan-precomisionado-${tituloProyecto.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      
      toast.success("PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF. Por favor intente nuevamente.");
    }
  }, [proyectos, getKPIs]);
  
  const generarExcel = useCallback(async (currentFiltros: FiltrosDashboard) => {
    try {
      toast.info("Preparando exportación a Excel...");
      
      // Importar librería xlsx dinámicamente
      const XLSX = await import('xlsx');
      
      // Filtrar datos según filtros aplicados
      const actividadesFiltradas = actividades.filter((actividad) => {
        return (
          (currentFiltros.proyecto === "todos" || actividad.proyectoId === currentFiltros.proyecto) &&
          (!currentFiltros.sistema || actividad.sistema === currentFiltros.sistema) &&
          (!currentFiltros.subsistema || actividad.subsistema === currentFiltros.subsistema) &&
          (!currentFiltros.busquedaActividad || 
            actividad.nombre.toLowerCase().includes((currentFiltros.busquedaActividad || "").toLowerCase()))
        );
      });
      
      const itrbsFiltrados = itrbItems.filter((itrb) => {
        const actividad = actividades.find(a => a.id === itrb.actividadId);
        if (!actividad) return false;
        
        const cumpleFiltroBasico = 
          (currentFiltros.proyecto === "todos" || actividad.proyectoId === currentFiltros.proyecto) &&
          (!currentFiltros.sistema || actividad.sistema === currentFiltros.sistema) &&
          (!currentFiltros.subsistema || actividad.subsistema === currentFiltros.subsistema);
          
        const cumpleFiltroEstado = !currentFiltros.estadoITRB || itrb.estado === currentFiltros.estadoITRB;
        
        // Usamos la propiedad correcta itrFilter que hemos añadido a la interfaz
        const cumpleBusquedaITR = !currentFiltros.itrFilter || 
          itrb.descripcion.toLowerCase().includes((currentFiltros.itrFilter || "").toLowerCase());
          
        return cumpleFiltroBasico && cumpleFiltroEstado && cumpleBusquedaITR;
      });

      // Preparar datos para Excel
      const actividadesData = actividadesFiltradas.map(a => ({
        ID: a.id,
        Proyecto: proyectos.find(p => p.id === a.proyectoId)?.titulo || "Sin proyecto",
        Nombre: a.nombre,
        Sistema: a.sistema,
        Subsistema: a.subsistema,
        "Fecha Inicio": a.fechaInicio,
        "Fecha Fin": a.fechaFin,
      }));
      
      const itrbsData = itrbsFiltrados.map(itrb => {
        const actividad = actividades.find(a => a.id === itrb.actividadId);
        return {
          ID: itrb.id,
          Descripción: itrb.descripcion,
          Estado: itrb.estado,
          "Cantidad Total": itrb.cantidadTotal,
          "Cantidad Realizada": itrb.cantidadRealizada,
          "Fecha Inicio": itrb.fechaInicio || "",
          "Fecha Límite": itrb.fechaLimite,
          Actividad: actividad?.nombre || "Desconocida",
          Sistema: actividad?.sistema || "Desconocido",
          Subsistema: actividad?.subsistema || "Desconocido",
          Observaciones: itrb.observaciones || ""
        };
      });
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Crear hojas
      const wsActividades = XLSX.utils.json_to_sheet(actividadesData);
      const wsITRBs = XLSX.utils.json_to_sheet(itrbsData);
      
      // Añadir hojas al libro
      XLSX.utils.book_append_sheet(wb, wsActividades, "Actividades");
      XLSX.utils.book_append_sheet(wb, wsITRBs, "ITRs");
      
      // Guardar archivo
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Crear blob y guardar
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `plan-precomisionado-${new Date().toISOString().slice(0,10)}.xlsx`);
      
      toast.success("Excel generado correctamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el archivo Excel. Por favor intente nuevamente.");
    }
  }, [actividades, itrbItems, proyectos]);
  
  return { generarPDF, generarExcel };
};
