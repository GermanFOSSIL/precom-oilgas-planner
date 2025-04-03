import React, { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OpcionesReporte } from "@/types";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ReportGenerator: React.FC = () => {
  const { proyectos, actividades, itrbItems, filtros, getKPIs } = useAppContext();
  const [opciones, setOpciones] = useState<OpcionesReporte>({
    incluirGantt: true,
    formatoGantt: "imagen",
    orientacion: "horizontal",
    incluirKPIs: true,
    incluirActividades: true,
    incluirITRB: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOpcionChange = (key: keyof OpcionesReporte, value: any) => {
    setOpciones({ ...opciones, [key]: value });
  };

  const generarReporte = async () => {
    setIsGenerating(true);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      await import('jspdf-autotable');
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      const doc = new jsPDF({
        orientation: opciones.orientacion === "horizontal" ? "landscape" : "portrait",
        unit: "mm",
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let currentY = 20;
      const margin = 10;

      const checkPageBreak = (contentHeight: number) => {
        if (currentY + contentHeight + margin > pageHeight) {
          doc.addPage({
            orientation: opciones.orientacion === "horizontal" ? "landscape" : "portrait",
            unit: "mm",
            format: 'a4'
          });
          currentY = 20;
        }
      };

      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Reporte de Precomisionado", margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generado: ${new Date().toLocaleString()}`, margin, currentY);
      currentY += 10;

      const proyectoNombre = filtros.proyecto !== "todos"
        ? proyectos.find(p => p.id === filtros.proyecto)?.titulo || "Todos los proyectos"
        : "Todos los proyectos";
      doc.text(`Proyecto: ${proyectoNombre}`, margin, currentY);
      currentY += 10;

      if (opciones.incluirKPIs) {
        const kpis = getKPIs(filtros.proyecto !== "todos" ? filtros.proyecto : undefined);
        const kpisData = [
          ["Avance Físico", `${kpis.avanceFisico.toFixed(1)}%`],
          ["ITR B Completados", `${kpis.realizadosITRB}/${kpis.totalITRB}`],
          ["Subsistemas con MCC", `${kpis.subsistemasMCC}/${kpis.totalSubsistemas}`],
          ["ITR B Vencidos", `${kpis.actividadesVencidas}`]
        ];

        checkPageBreak(kpisData.length * 10);

        (doc as any).autoTable({
          startY: currentY,
          head: [["Indicador", "Valor"]],
          body: kpisData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
        currentY = (doc as any).lastAutoTable.finalY + margin;
      }

      if (opciones.incluirGantt) {
        const ganttChartModule = await import('@/components/EnhancedGanttChart');
        const ganttChart = ganttChartModule.default;

        const ganttChartContainer = document.querySelector('.gantt-chart-container');

        if (ganttChartContainer) {
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

          ganttChartContainer.appendChild(timestamp);

          const canvas = await html2canvas(ganttChartContainer, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: ganttChartContainer.scrollWidth,
            height: ganttChartContainer.scrollHeight
          });

          ganttChartContainer.removeChild(timestamp);

          const imgData = canvas.toDataURL('image/png');

          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          checkPageBreak(imgHeight);

          doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + margin;
        } else {
          console.warn("Gantt chart container not found.");
          toast.error("No se pudo encontrar el gráfico Gantt para incluir en el reporte.");
        }
      }

      if (opciones.incluirActividades) {
        const actividadesFiltradas = actividades.filter(act =>
          filtros.proyecto === "todos" || act.proyectoId === filtros.proyecto
        );

        if (actividadesFiltradas.length > 0) {
          const actividadesData = actividadesFiltradas.map(act => [
            act.nombre,
            act.sistema,
            act.subsistema,
            new Date(act.fechaInicio).toLocaleDateString('es-ES'),
            new Date(act.fechaFin).toLocaleDateString('es-ES'),
            `${act.duracion} días`
          ]);

          checkPageBreak(actividadesData.length * 10);

          (doc as any).autoTable({
            startY: currentY,
            head: [['Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración']],
            body: actividadesData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
          });
          currentY = (doc as any).lastAutoTable.finalY + margin;
        }
      }

      if (opciones.incluirITRB) {
        const itrbsFiltrados = itrbItems.filter(itrb => {
          const actividad = actividades.find(act => act.id === itrb.actividadId);
          return !actividad || filtros.proyecto === "todos" || actividad.proyectoId === filtros.proyecto;
        });

        if (itrbsFiltrados.length > 0) {
          const itrbData = itrbsFiltrados.map(itrb => {
            const actividad = actividades.find(act => act.id === itrb.actividadId);
            return [
              itrb.descripcion,
              actividad?.sistema || "",
              actividad?.subsistema || "",
              `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
              itrb.estado,
              itrb.mcc ? "Sí" : "No"
            ];
          });

          checkPageBreak(itrbData.length * 10);

          (doc as any).autoTable({
            startY: currentY,
            head: [['Descripción', 'Sistema', 'Subsistema', 'Realizado/Total', 'Estado', 'MCC']],
            body: itrbData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
          });
          currentY = (doc as any).lastAutoTable.finalY + margin;
        }
      }

      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount} - Reporte de Precomisionado - Generado: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save("reporte-precomisionado.pdf");
      toast.success("Reporte generado exitosamente");
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      toast.error("Error al generar el reporte: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generar Reporte
        </CardTitle>
        <CardDescription>
          Configura las opciones para generar un reporte detallado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="incluirGantt" className="flex items-center space-x-2">
              <Checkbox
                id="incluirGantt"
                checked={opciones.incluirGantt}
                onCheckedChange={(checked) => handleOpcionChange("incluirGantt", checked)}
              />
              <span>Incluir Gráfico Gantt</span>
            </Label>
          </div>

          <div>
            <Label htmlFor="incluirKPIs" className="flex items-center space-x-2">
              <Checkbox
                id="incluirKPIs"
                checked={opciones.incluirKPIs}
                onCheckedChange={(checked) => handleOpcionChange("incluirKPIs", checked)}
              />
              <span>Incluir KPIs</span>
            </Label>
          </div>

          <div>
            <Label htmlFor="incluirActividades" className="flex items-center space-x-2">
              <Checkbox
                id="incluirActividades"
                checked={opciones.incluirActividades}
                onCheckedChange={(checked) => handleOpcionChange("incluirActividades", checked)}
              />
              <span>Incluir Tabla de Actividades</span>
            </Label>
          </div>

          <div>
            <Label htmlFor="incluirITRB" className="flex items-center space-x-2">
              <Checkbox
                id="incluirITRB"
                checked={opciones.incluirITRB}
                onCheckedChange={(checked) => handleOpcionChange("incluirITRB", checked)}
              />
              <span>Incluir Tabla de ITR B</span>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="orientacion">Orientación</Label>
            <select
              id="orientacion"
              className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={opciones.orientacion}
              onChange={(e) => handleOpcionChange("orientacion", e.target.value)}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
        </div>
      </CardContent>
      <Button onClick={generarReporte} disabled={isGenerating}>
        {isGenerating ? (
          <div className="flex items-center">
            Generando...
            <svg className="animate-spin h-5 w-5 ml-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Generar Reporte
          </>
        )}
      </Button>
    </Card>
  );
};

export default ReportGenerator;
