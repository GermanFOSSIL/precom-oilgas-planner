
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Download, FilePdf, FileText, Settings, Image, Palette } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportConfig {
  titulo: string;
  incluirLogo: boolean;
  incluirFecha: boolean;
  incluirProyectoInfo: boolean;
  colorPrimario: string;
  incluirActividades: boolean;
  incluirITRB: boolean;
  incluirEstadisticas: boolean;
  orientacion: "portrait" | "landscape";
  tamano: "a4" | "letter" | "legal";
  comentarios: string;
}

const ReportGenerator: React.FC = () => {
  const { actividades, itrbItems, proyectos, proyectoActual, filtros } = useAppContext();
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    titulo: "Informe de Plan de Precomisionado",
    incluirLogo: true,
    incluirFecha: true,
    incluirProyectoInfo: true,
    colorPrimario: "#3B82F6", // Azul por defecto
    incluirActividades: true,
    incluirITRB: true,
    incluirEstadisticas: true,
    orientacion: "portrait",
    tamano: "a4",
    comentarios: ""
  });
  
  const [previewMode, setPreviewMode] = useState<"pdf" | "excel">("pdf");
  
  // Función para actualizar la configuración del informe
  const handleConfigChange = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Función para generar PDF
  const generatePDF = () => {
    // Inicializar el documento PDF con la orientación y tamaño seleccionados
    const doc = new jsPDF({
      orientation: reportConfig.orientacion,
      unit: "mm",
      format: reportConfig.tamano
    });
    
    const currentDate = new Date().toLocaleDateString('es-ES');
    const currentTime = new Date().toLocaleTimeString('es-ES');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Convertir color hexadecimal a valores RGB para jsPDF
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };
    
    const primaryColor = hexToRgb(reportConfig.colorPrimario);
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    
    // Agregar encabezado
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(reportConfig.titulo, margin, 18);
    
    // Información del proyecto y fecha
    let yPos = 40;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    if (reportConfig.incluirFecha) {
      doc.setFontSize(10);
      doc.text(`Fecha de generación: ${currentDate} - ${currentTime}`, margin, yPos);
      yPos += 7;
    }
    
    if (reportConfig.incluirProyectoInfo) {
      const proyecto = proyectos.find(p => p.id === proyectoActual);
      if (proyecto && proyectoActual !== "todos") {
        doc.setFontSize(14);
        doc.text(`Proyecto: ${proyecto.titulo}`, margin, yPos);
        yPos += 7;
        
        if (proyecto.descripcion) {
          doc.setFontSize(10);
          doc.text(`Descripción: ${proyecto.descripcion}`, margin, yPos);
          yPos += 10;
        }
      } else {
        doc.setFontSize(14);
        doc.text("Proyecto: Todos los proyectos", margin, yPos);
        yPos += 10;
      }
    }
    
    // Separador
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
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
    if (reportConfig.incluirEstadisticas) {
      doc.setFontSize(16);
      doc.setTextColor(primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255);
      doc.text("Resumen Estadístico", margin, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
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
        startY: yPos,
        head: [["Estadística", "Valor"]],
        body: estadisticasData,
        theme: 'grid',
        headStyles: { 
          fillColor: [primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255],
          textColor: [255, 255, 255]
        },
        columnStyles: {
          0: { fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Sección de Actividades
    if (reportConfig.incluirActividades && actividadesFiltradas.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255);
      doc.text("Listado de Actividades", margin, yPos);
      yPos += 10;
      
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
        startY: yPos,
        head: [['Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración', 'Proyecto']],
        body: actividadesData,
        theme: 'striped',
        headStyles: { 
          fillColor: [primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255],
          textColor: [255, 255, 255]
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Verificar si necesitamos agregar una nueva página
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
      }
    }
    
    // Sección de ITR B
    if (reportConfig.incluirITRB && itrbFiltrados.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255);
      doc.text("Listado de ITR B", margin, yPos);
      yPos += 10;
      
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
        startY: yPos,
        head: [['Descripción', 'Actividad', 'Sistema', 'Progreso', 'Estado', 'CCC', 'Fecha Límite']],
        body: itrbData,
        theme: 'striped',
        headStyles: { 
          fillColor: [primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255],
          textColor: [255, 255, 255]
        },
        margin: { left: margin, right: margin }
      });
    }
    
    // Agregar comentarios si existen
    if (reportConfig.comentarios) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(primaryColor.r * 255, primaryColor.g * 255, primaryColor.b * 255);
      doc.text("Comentarios Adicionales", margin, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(reportConfig.comentarios, margin, 30);
    }
    
    // Pie de página en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages} - Plan de Precomisionado v1.0.0`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
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
    
    // Crear hojas de trabajo para el Excel
    const wb = XLSX.utils.book_new();
    
    // Hoja de actividades
    if (reportConfig.incluirActividades) {
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
    }
    
    // Hoja de ITR B
    if (reportConfig.incluirITRB) {
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
    }
    
    // Hoja de estadísticas
    if (reportConfig.incluirEstadisticas) {
      const totalActividades = actividadesFiltradas.length;
      const totalITRB = itrbFiltrados.length;
      const itrbCompletados = itrbFiltrados.filter(itrb => itrb.estado === "Completado").length;
      const itrbEnCurso = itrbFiltrados.filter(itrb => itrb.estado === "En curso").length;
      const itrbVencidos = itrbFiltrados.filter(itrb => itrb.estado === "Vencido").length;
      
      const porcentajeCompletado = totalITRB > 0 ? (itrbCompletados / totalITRB) * 100 : 0;
      
      const estadisticasData = [
        { Estadística: "Total de Actividades", Valor: totalActividades },
        { Estadística: "Total de ITR B", Valor: totalITRB },
        { Estadística: "ITR B Completados", Valor: itrbCompletados, Porcentaje: porcentajeCompletado.toFixed(2) + "%" },
        { Estadística: "ITR B En Curso", Valor: itrbEnCurso },
        { Estadística: "ITR B Vencidos", Valor: itrbVencidos }
      ];
      
      const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasData);
      XLSX.utils.book_append_sheet(wb, wsEstadisticas, "Estadísticas");
    }
    
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
          Personalice y genere informes del plan de precomisionado
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="opciones" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="opciones">Opciones generales</TabsTrigger>
            <TabsTrigger value="contenido">Contenido</TabsTrigger>
            <TabsTrigger value="prevista">Vista previa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="opciones" className="mt-4 space-y-5">
            <div className="space-y-3">
              <Label htmlFor="titulo">Título del informe</Label>
              <Input 
                id="titulo" 
                value={reportConfig.titulo}
                onChange={(e) => handleConfigChange("titulo", e.target.value)}
                placeholder="Informe de Plan de Precomisionado"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Orientación</Label>
                <RadioGroup
                  value={reportConfig.orientacion}
                  onValueChange={(value: "portrait" | "landscape") => handleConfigChange("orientacion", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait">Vertical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape">Horizontal</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label>Tamaño de página</Label>
                <RadioGroup
                  value={reportConfig.tamano}
                  onValueChange={(value: "a4" | "letter" | "legal") => handleConfigChange("tamano", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="a4" id="a4" />
                    <Label htmlFor="a4">A4</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="letter" id="letter" />
                    <Label htmlFor="letter">Carta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="legal" id="legal" />
                    <Label htmlFor="legal">Legal</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Color primario</Label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color"
                  value={reportConfig.colorPrimario}
                  onChange={(e) => handleConfigChange("colorPrimario", e.target.value)}
                  className="w-12 h-8 rounded border"
                />
                <span className="text-sm">{reportConfig.colorPrimario}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Opciones de cabecera</Label>
              <div className="flex flex-col space-y-2 mt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluirLogo"
                    checked={reportConfig.incluirLogo}
                    onCheckedChange={(checked) => handleConfigChange("incluirLogo", Boolean(checked))}
                  />
                  <Label htmlFor="incluirLogo">Incluir logo de la empresa</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluirFecha"
                    checked={reportConfig.incluirFecha}
                    onCheckedChange={(checked) => handleConfigChange("incluirFecha", Boolean(checked))}
                  />
                  <Label htmlFor="incluirFecha">Incluir fecha de generación</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluirProyectoInfo"
                    checked={reportConfig.incluirProyectoInfo}
                    onCheckedChange={(checked) => handleConfigChange("incluirProyectoInfo", Boolean(checked))}
                  />
                  <Label htmlFor="incluirProyectoInfo">Incluir información del proyecto</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="comentarios">Comentarios adicionales</Label>
              <textarea
                id="comentarios" 
                value={reportConfig.comentarios}
                onChange={(e) => handleConfigChange("comentarios", e.target.value)}
                placeholder="Agregue cualquier comentario o nota que quiera incluir en el informe"
                className="w-full p-2 min-h-[100px] border rounded"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="contenido" className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label>Secciones a incluir</Label>
              <div className="flex flex-col space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluirEstadisticas"
                    checked={reportConfig.incluirEstadisticas}
                    onCheckedChange={(checked) => handleConfigChange("incluirEstadisticas", Boolean(checked))}
                  />
                  <Label htmlFor="incluirEstadisticas">Incluir estadísticas generales</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluirActividades"
                    checked={reportConfig.incluirActividades}
                    onCheckedChange={(checked) => handleConfigChange("incluirActividades", Boolean(checked))}
                  />
                  <Label htmlFor="incluirActividades">Incluir listado de actividades</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incluirITRB"
                    checked={reportConfig.incluirITRB}
                    onCheckedChange={(checked) => handleConfigChange("incluirITRB", Boolean(checked))}
                  />
                  <Label htmlFor="incluirITRB">Incluir listado de ITR B</Label>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h3 className="font-medium">Vista previa del contenido</h3>
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="font-bold">{reportConfig.titulo}</span>
                  {reportConfig.incluirFecha && (
                    <span className="text-sm text-muted-foreground">Fecha de generación: {new Date().toLocaleDateString('es-ES')}</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {reportConfig.incluirProyectoInfo && (
                    <div className="text-sm border-l-2 pl-2" style={{ borderColor: reportConfig.colorPrimario }}>
                      <p className="font-medium">Proyecto: {proyectoActual !== "todos" 
                        ? proyectos.find(p => p.id === proyectoActual)?.titulo || "Proyecto seleccionado" 
                        : "Todos los proyectos"}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  {reportConfig.incluirEstadisticas && (
                    <div className="text-sm">
                      <div className="font-medium" style={{ color: reportConfig.colorPrimario }}>Estadísticas Generales</div>
                      <div className="text-muted-foreground">- Resumen estadístico global del proyecto</div>
                    </div>
                  )}
                  
                  {reportConfig.incluirActividades && (
                    <div className="text-sm">
                      <div className="font-medium" style={{ color: reportConfig.colorPrimario }}>Listado de Actividades</div>
                      <div className="text-muted-foreground">- Tabla detallada de actividades</div>
                    </div>
                  )}
                  
                  {reportConfig.incluirITRB && (
                    <div className="text-sm">
                      <div className="font-medium" style={{ color: reportConfig.colorPrimario }}>Listado de ITR B</div>
                      <div className="text-muted-foreground">- Tabla detallada de ITR B</div>
                    </div>
                  )}
                </div>
                
                {reportConfig.comentarios && (
                  <div className="text-sm mt-3">
                    <div className="font-medium" style={{ color: reportConfig.colorPrimario }}>Comentarios Adicionales</div>
                    <div className="text-muted-foreground italic">"{reportConfig.comentarios.substring(0, 100)}{reportConfig.comentarios.length > 100 ? '...' : ''}"</div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prevista" className="mt-4 space-y-5">
            <div className="flex justify-between items-center mb-4">
              <div className="space-x-4">
                <Button
                  variant={previewMode === "pdf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("pdf")}
                >
                  <FilePdf className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                
                <Button
                  variant={previewMode === "excel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("excel")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
              
              <Button 
                onClick={previewMode === "pdf" ? generatePDF : generateExcel}
              >
                <Download className="h-4 w-4 mr-2" />
                Generar {previewMode === "pdf" ? "PDF" : "Excel"}
              </Button>
            </div>
            
            <div className="border rounded-md p-4">
              {previewMode === "pdf" ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-full max-w-md border shadow-md rounded-md overflow-hidden">
                    {/* Simulación de una página PDF */}
                    <div className="h-10" style={{ backgroundColor: reportConfig.colorPrimario }}>
                      <div className="text-white font-bold text-lg p-2">{reportConfig.titulo}</div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {reportConfig.incluirFecha && (
                        <div className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-ES')}</div>
                      )}
                      
                      {reportConfig.incluirProyectoInfo && (
                        <div className="text-sm">
                          <p className="font-medium">Proyecto: {proyectoActual !== "todos" 
                            ? proyectos.find(p => p.id === proyectoActual)?.titulo || "Proyecto seleccionado" 
                            : "Todos los proyectos"}</p>
                        </div>
                      )}
                      
                      <div className="w-full border-t mt-2 mb-2" style={{ borderColor: reportConfig.colorPrimario }}></div>
                      
                      {reportConfig.incluirEstadisticas && (
                        <div>
                          <div className="font-medium mb-1" style={{ color: reportConfig.colorPrimario }}>Estadísticas</div>
                          <div className="bg-gray-100 p-2 rounded text-xs">
                            <table className="w-full">
                              <thead style={{ backgroundColor: reportConfig.colorPrimario, color: 'white' }}>
                                <tr>
                                  <th className="p-1 border">Estadística</th>
                                  <th className="p-1 border">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="p-1 border">Total Actividades</td>
                                  <td className="p-1 border text-center">{actividades.filter(act => 
                                    proyectoActual === "todos" || act.proyectoId === proyectoActual
                                  ).length}</td>
                                </tr>
                                <tr>
                                  <td className="p-1 border">Total ITR B</td>
                                  <td className="p-1 border text-center">{itrbItems.filter(itrb => {
                                    const actividad = actividades.find(act => act.id === itrb.actividadId);
                                    return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
                                  }).length}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {reportConfig.incluirActividades && (
                        <div>
                          <div className="font-medium mb-1" style={{ color: reportConfig.colorPrimario }}>Actividades</div>
                          <div className="text-xs text-gray-500 italic">Vista previa de tabla de actividades...</div>
                        </div>
                      )}
                      
                      {reportConfig.incluirITRB && (
                        <div>
                          <div className="font-medium mb-1" style={{ color: reportConfig.colorPrimario }}>ITR B</div>
                          <div className="text-xs text-gray-500 italic">Vista previa de tabla de ITR B...</div>
                        </div>
                      )}
                      
                      <div className="text-xs text-center text-gray-400 pt-10">
                        Página 1 de 1 - Plan de Precomisionado v1.0.0
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Vista previa simplificada. El PDF generado tendrá todas las tablas y datos completos.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-full max-w-md space-y-4">
                    <div className="border">
                      <div className="bg-green-100 p-2 border-b flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                        <span className="text-sm font-medium">Actividades</span>
                      </div>
                      <div className="p-2">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-1 border text-left">Nombre</th>
                              <th className="p-1 border text-left">Sistema</th>
                              <th className="p-1 border text-left">Inicio</th>
                              <th className="p-1 border text-left">Fin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {actividades.filter(act => 
                              proyectoActual === "todos" || act.proyectoId === proyectoActual
                            ).slice(0, 3).map((act, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-1 border">{act.nombre}</td>
                                <td className="p-1 border">{act.sistema}</td>
                                <td className="p-1 border">{new Date(act.fechaInicio).toLocaleDateString('es-ES')}</td>
                                <td className="p-1 border">{new Date(act.fechaFin).toLocaleDateString('es-ES')}</td>
                              </tr>
                            ))}
                            {actividades.filter(act => 
                              proyectoActual === "todos" || act.proyectoId === proyectoActual
                            ).length > 3 && (
                              <tr>
                                <td colSpan={4} className="p-1 border text-center">...</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {reportConfig.incluirITRB && (
                      <div className="border">
                        <div className="bg-blue-100 p-2 border-b flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                          <span className="text-sm font-medium">ITR B</span>
                        </div>
                        <div className="p-2">
                          <div className="text-xs text-gray-500 italic">Hoja de ITR B con todos los registros...</div>
                        </div>
                      </div>
                    )}
                    
                    {reportConfig.incluirEstadisticas && (
                      <div className="border">
                        <div className="bg-purple-100 p-2 border-b flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-500 rounded-sm"></div>
                          <span className="text-sm font-medium">Estadísticas</span>
                        </div>
                        <div className="p-2">
                          <div className="text-xs text-gray-500 italic">Hoja de estadísticas y resumen...</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Vista previa simplificada. El Excel generado tendrá todas las hojas y datos completos.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={previewMode === "pdf" ? generatePDF : generateExcel}>
            <Download className="h-4 w-4 mr-2" />
            Generar {previewMode === "pdf" ? "PDF" : "Excel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
