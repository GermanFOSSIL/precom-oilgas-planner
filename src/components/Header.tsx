import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilePenLine, FileText, LogOut, FileSpreadsheet, Image } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import html2canvas from 'html2canvas';

const Header: React.FC = () => {
  const { user, logout, actividades, itrbItems, getKPIs, proyectos, filtros } = useAppContext();
  const [exportingChart, setExportingChart] = React.useState(false);

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const today = new Date();
      const formattedDate = today.toLocaleDateString("es-ES");
      
      doc.setFontSize(18);
      doc.text("Plan de Ejecución de Precomisionado", 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Fecha de exportación: ${formattedDate}`, 14, 30);
      
      const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
      doc.text(`Avance físico total: ${kpis.avanceFisico.toFixed(2)}%`, 14, 40);
      doc.text(`ITR B realizados: ${kpis.realizadosITRB} de ${kpis.totalITRB}`, 14, 46);
      doc.text(`Subsistemas con MCC: ${kpis.subsistemasMCC}`, 14, 52);
      doc.text(`Actividades vencidas: ${kpis.actividadesVencidas}`, 14, 58);
      
      const filteredITRB = itrbItems.filter(item => {
        if (filtros.proyecto === "todos") return true;
        const actividad = actividades.find(act => act.id === item.actividadId);
        return actividad && actividad.proyectoId === filtros.proyecto;
      });
      
      const tableData = filteredITRB.map(item => {
        const actividad = actividades.find(act => act.id === item.actividadId);
        return [
          item.descripcion,
          actividad?.sistema || "",
          actividad?.subsistema || "",
          `${item.cantidadRealizada}/${item.cantidadTotal}`,
          `${((item.cantidadRealizada / item.cantidadTotal) * 100).toFixed(2)}%`,
          item.estado,
          item.mcc ? "Sí" : "No",
          new Date(item.fechaLimite).toLocaleDateString("es-ES")
        ];
      });
      
      (doc as any).autoTable({
        head: [["Descripción", "Sistema", "Subsistema", "Realizados/Total", "Avance", "Estado", "MCC", "Fecha Límite"]],
        body: tableData,
        startY: 65,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138] }
      });
      
      doc.save("Plan_Precomisionado.pdf");
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF. Por favor intente nuevamente.");
    }
  };

  const exportToExcel = () => {
    try {
      const filteredITRB = itrbItems.filter(item => {
        if (filtros.proyecto === "todos") return true;
        const actividad = actividades.find(act => act.id === item.actividadId);
        return actividad && actividad.proyectoId === filtros.proyecto;
      });
      
      const filteredActividades = actividades.filter(act => 
        filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
      );
      
      const itrbData = filteredITRB.map(item => {
        const actividad = actividades.find(act => act.id === item.actividadId);
        return {
          "Descripción": item.descripcion,
          "Sistema": actividad?.sistema || "",
          "Subsistema": actividad?.subsistema || "",
          "Actividad": actividad?.nombre || "",
          "Realizados": item.cantidadRealizada,
          "Total": item.cantidadTotal,
          "Avance": `${((item.cantidadRealizada / item.cantidadTotal) * 100).toFixed(2)}%`,
          "Estado": item.estado,
          "MCC": item.mcc ? "Sí" : "No",
          "Fecha Límite": new Date(item.fechaLimite).toLocaleDateString("es-ES")
        };
      });
      
      const actividadesData = filteredActividades.map(act => ({
        "ID": act.id,
        "Nombre": act.nombre,
        "Sistema": act.sistema,
        "Subsistema": act.subsistema,
        "Fecha Inicio": new Date(act.fechaInicio).toLocaleDateString("es-ES"),
        "Fecha Fin": new Date(act.fechaFin).toLocaleDateString("es-ES"),
        "Duración (días)": act.duracion,
        "Proyecto": proyectos.find(p => p.id === act.proyectoId)?.titulo || ""
      }));
      
      const wb = XLSX.utils.book_new();
      
      const wsITRB = XLSX.utils.json_to_sheet(itrbData);
      XLSX.utils.book_append_sheet(wb, wsITRB, "ITR B");
      
      const wsAct = XLSX.utils.json_to_sheet(actividadesData);
      XLSX.utils.book_append_sheet(wb, wsAct, "Actividades");
      
      XLSX.writeFile(wb, "Plan_Precomisionado.xlsx");
      toast.success("Excel generado exitosamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel. Por favor intente nuevamente.");
    }
  };

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
      
      const clonedContainer = visibleGanttContainer.cloneNode(true) as HTMLElement;
      
      clonedContainer.style.position = 'absolute';
      clonedContainer.style.left = '-9999px';
      clonedContainer.style.width = `${visibleGanttContainer.scrollWidth}px`;
      clonedContainer.style.height = `${visibleGanttContainer.scrollHeight}px`;
      document.body.appendChild(clonedContainer);
      
      const canvas = await html2canvas(clonedContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: visibleGanttContainer.scrollWidth,
        height: visibleGanttContainer.scrollHeight
      });
      
      document.body.removeChild(clonedContainer);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error al capturar el diagrama de Gantt:", error);
      toast.error("No se pudo capturar el diagrama de Gantt. Intente nuevamente.");
      return null;
    }
  };

  const generarPDF = async () => {
    try {
      setExportingChart(true);
      
      const ganttImageData = await captureGanttChart();
      if (!ganttImageData) {
        toast.error("No se pudo capturar el diagrama de Gantt");
        setExportingChart(false);
        return;
      }
      
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm"
      });
      
      doc.text("Dashboard - Plan de Precomisionado", 14, 20);
      doc.text("Fecha: " + new Date().toLocaleDateString('es-ES'), 14, 30);
      
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
      
      doc.save("gantt-chart-precomisionado.pdf");
      toast.success("PDF del diagrama de Gantt generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setExportingChart(false);
    }
  };

  const generateGanttDataForExcel = () => {
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

  const generarExcel = async () => {
    try {
      setExportingChart(true);
      
      const wb = XLSX.utils.book_new();
      
      const ganttData = generateGanttDataForExcel();
      
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
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el Excel");
    } finally {
      setExportingChart(false);
    }
  };

  return (
    <header className="border-b sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-oilgas-primary" />
          <h1 className="text-xl font-bold text-oilgas-primary">
            Plan de Precomisionado
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FilePenLine className="h-4 w-4 mr-2" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Exportar a Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={generarPDF} className="cursor-pointer">
                <Image className="h-4 w-4 mr-2" />
                Gantt PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generarExcel} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Gantt Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {user?.email.split('@')[0]}
                <span className="px-2 py-0.5 text-xs rounded-full bg-oilgas-primary text-white">
                  {user?.role === "admin" ? "Admin" : user?.role === "tecnico" ? "Técnico" : "Visualizador"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Usuario</DropdownMenuLabel>
              <DropdownMenuItem className="text-xs opacity-50 cursor-default">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
