import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuid } from 'uuid';
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICards from "@/components/KPICards";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import AlertasWidget from "@/components/AlertasWidget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Calendar,
  FileText,
  Table2,
  Filter,
  Search,
  Download,
  SunMoon,
  AlertTriangle,
  Image,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltrosDashboard, ConfiguracionGrafico, GraficoPersonalizado } from "@/types";
import { Input } from "@/components/ui/input";
import PublicHeader from "@/components/PublicHeader";
import ProyectoSelector from "@/components/ProyectoSelector";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  titulo: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  tipo: z.enum(["barras", "lineas", "area", "pastel"]),
  datos: z.enum(["actividades", "itrb", "avance", "vencimientos"]),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, {
    message: "El color debe ser un código hexadecimal válido.",
  }),
});

const Dashboard: React.FC = () => {
  const {
    proyectos,
    filtros,
    setFiltros,
    theme,
    toggleTheme,
    actividades,
    itrbItems,
    logout,
    getKPIs
  } = useAppContext();

  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true
  });

  const [tabActual, setTabActual] = useState("gantt");
  const ganttChartRef = React.useRef<HTMLDivElement | null>(null);
  const [exportingChart, setExportingChart] = useState(false);

  const [mostrarSubsistemas, setMostrarSubsistemas] = useState(true);
  const [codigoITRFilter, setCodigoITRFilter] = useState("");
  const [modoFiltroAvanzado, setModoFiltroAvanzado] = useState(false);
  const [graficosPersonalizados, setGraficosPersonalizados] = useState<GraficoPersonalizado[]>([
    {
      id: uuid(),
      titulo: "Actividades por sistema",
      tipo: "barras",
      datos: "actividades",
      color: "#3b82f6",
      posicion: 0
    },
    {
      id: uuid(),
      titulo: "Avance general",
      tipo: "lineas",
      datos: "avance",
      color: "#16a34a",
      posicion: 1
    }
  ]);
  const [editandoGraficoId, setEditandoGraficoId] = useState<string | null>(null);

  useEffect(() => {
    setFiltros({ ...filtros, timestamp: Date.now() });
  }, []);

  const sistemasDisponibles = Array.from(
    new Set(actividades.map(act => act.sistema))
  );

  const subsistemasFiltrados = Array.from(
    new Set(
      actividades
        .filter(act => !filtros.sistema || act.sistema === filtros.sistema)
        .map(act => act.subsistema)
    )
  );

  const handleFiltroChange = (key: keyof FiltrosDashboard, value: any) => {
    if (key === 'timestamp' && typeof value === 'string') {
      setFiltros({ ...filtros, [key]: Number(value) });
    } else {
      setFiltros({ ...filtros, [key]: value });
    }
  };

  const handleTamanoGrafico = (tamano: ConfiguracionGrafico["tamano"]) => {
    setConfiguracionGrafico({ ...configuracionGrafico, tamano });
  };

  const handleResetSession = () => {
    logout();
    window.location.reload();
  };

  const getGanttHeight = () => {
    switch (configuracionGrafico.tamano) {
      case "pequeno": return "h-[400px]";
      case "mediano": return "h-[600px]";
      case "grande": return "h-[800px]";
      case "completo": return "h-screen";
      default: return "h-[600px]";
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
        console.warn("No se pudo encontrar un diagrama de Gantt visible en el DOM");

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

  const generarPDF = async () => {
    try {
      setExportingChart(true);

      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      await import('jspdf-autotable');

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
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setExportingChart(false);
    }
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

  const handleSubsistemaToggle = (checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setMostrarSubsistemas(checked);

      setConfiguracionGrafico({
        ...configuracionGrafico,
        mostrarSubsistemas: checked
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(graficosPersonalizados);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar la posición de los gráficos
    const updatedGraficos = items.map((grafico, index) => ({ ...grafico, posicion: index }));

    setGraficosPersonalizados(updatedGraficos);
  };

  const addNewCustomChart = () => {
    setGraficosPersonalizados(prev => [
      ...prev,
      {
        id: uuid(),
        titulo: "Nuevo gráfico",
        tipo: "barras",
        datos: "actividades",
        color: "#3b82f6", // Ensure color property is always present
        posicion: prev.length
      }
    ]);
  };

  const deleteCustomChart = (id: string) => {
    setGraficosPersonalizados(prev => {
      const updatedGraficos = prev.filter(grafico => grafico.id !== id);
      return updatedGraficos.map((grafico, index) => ({ ...grafico, posicion: index }));
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      tipo: "barras",
      datos: "actividades",
      color: "#3b82f6",
    },
  });

  const editarGrafico = (id: string) => {
    const graficoAEditar = graficosPersonalizados.find(grafico => grafico.id === id);
    if (graficoAEditar) {
      form.reset(graficoAEditar);
      setEditandoGraficoId(id);
    }
  };

  const cancelarEdicion = () => {
    setEditandoGraficoId(null);
    form.reset();
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setGraficosPersonalizados(prev =>
      prev.map(grafico =>
        grafico.id === editandoGraficoId
          ? { ...grafico, ...values }
          : grafico
      )
    );
    toast.success("Gráfico actualizado exitosamente");
    cancelarEdicion();
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ProyectoSelector />

            <Button
              variant="outline"
              size="icon"
              onClick={handleResetSession}
              title="Restablecer sesión"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filtros de Sistema</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Select
                    value={filtros.sistema || ""}
                    onValueChange={(value) => handleFiltroChange("sistema", value || undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los sistemas</SelectItem>
                      {sistemasDisponibles.map((sistema) => (
                        <SelectItem key={sistema} value={sistema}>
                          {sistema}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-2">
                  <Select
                    value={filtros.subsistema || ""}
                    onValueChange={(value) => handleFiltroChange("subsistema", value || undefined)}
                    disabled={!filtros.sistema}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Subsistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los subsistemas</SelectItem>
                      {subsistemasFiltrados.map((subsistema) => (
                        <SelectItem key={subsistema} value={subsistema}>
                          {subsistema}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Estado ITR</DropdownMenuLabel>
                <div className="p-2">
                  <Select
                    value={filtros.estadoITRB || ""}
                    onValueChange={(value: any) => handleFiltroChange("estadoITRB", value || undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                      <SelectItem value="En curso">En curso</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />
                <div className="p-2 flex items-center space-x-2">
                  <Checkbox
                    id="filter-vencidas"
                    checked={!!filtros.tareaVencida}
                    onCheckedChange={(checked) => handleFiltroChange("tareaVencida", checked)}
                  />
                  <Label htmlFor="filter-vencidas">Mostrar sólo vencidas</Label>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={modoFiltroAvanzado ? "default" : "outline"}
                  className={modoFiltroAvanzado ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Filtro avanzado
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtros avanzados</h4>

                  <div className="space-y-2">
                    <Label htmlFor="codigo-itr">Código ITR</Label>
                    <Input
                      id="codigo-itr"
                      placeholder="Ej: I01A"
                      value={codigoITRFilter}
                      onChange={(e) => {
                        setCodigoITRFilter(e.target.value);
                        setModoFiltroAvanzado(!!e.target.value);
                        handleFiltroChange("busquedaActividad", e.target.value);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Buscar por código o parte del nombre del ITR
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mostrar-subsistemas"
                      checked={mostrarSubsistemas}
                      onCheckedChange={handleSubsistemaToggle}
                    />
                    <Label htmlFor="mostrar-subsistemas">
                      Mostrar Subsistemas
                    </Label>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCodigoITRFilter("");
                        setModoFiltroAvanzado(false);
                        handleFiltroChange("busquedaActividad", "");
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={toggleTheme}
              className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-600"
            >
              <SunMoon className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  disabled={exportingChart}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={generarPDF} disabled={exportingChart}>
                  <Image className="h-4 w-4 mr-2" />
                  Generar PDF con Gantt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generarExcel} disabled={exportingChart}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />

        <Tabs
          defaultValue="gantt"
          className="w-full"
          value={tabActual}
          onValueChange={setTabActual}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-full md:w-auto grid-cols-3 mb-0">
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Gráfico Gantt</span>
              </TabsTrigger>
              <TabsTrigger value="critical-path" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Ruta Crítica</span>
              </TabsTrigger>
              <TabsTrigger value="alertas" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
            </TabsList>

            {tabActual === "gantt" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarSubsistemas(!mostrarSubsistemas)}
                  className="flex items-center gap-1"
                >
                  {mostrarSubsistemas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {mostrarSubsistemas ? "Ocultar subsistemas" : "Mostrar subsistemas"}
                </Button>

                <Select
                  value={configuracionGrafico.tamano}
                  onValueChange={(value: "pequeno" | "mediano" | "grande" | "completo") =>
                    handleTamanoGrafico(value)
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequeno">Pequeño</SelectItem>
                    <SelectItem value="mediano">Mediano</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                    <SelectItem value="completo">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="gantt" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className={`p-0 overflow-hidden ${getGanttHeight()}`}>
                <div ref={ganttChartRef} className="w-full h-full">
                  <EnhancedGanttChart
                    filtros={{
                      ...filtros,
                      busquedaActividad: codigoITRFilter || filtros.busquedaActividad
                    }}
                    configuracion={{
                      ...configuracionGrafico,
                      mostrarSubsistemas: mostrarSubsistemas
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="critical-path" className="mt-0">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-0 overflow-hidden h-[600px]">
                {/* <CriticalPathView /> */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
              <AlertasWidget />
            </div>
          </TabsContent>
        </Tabs>

        <Card className="dark:bg-slate-800 dark:border-slate-700 mt-6">
          <CardHeader>
            <CardTitle>Gráficos Personalizados</CardTitle>
            <CardDescription>
              Arrastra y suelta para reordenar, edita o elimina los gráficos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="graficos">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {graficosPersonalizados.map((grafico, index) => (
                      <Draggable key={grafico.id} draggableId={grafico.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-4 p-4 border rounded-md shadow-sm bg-white dark:bg-slate-700 dark:border-slate-600"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: grafico.color }}
                                />
                                <span className="font-medium">{grafico.titulo}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({grafico.tipo} • {grafico.datos})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarGrafico(grafico.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCustomChart(grafico.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <Button
              variant="outline"
              onClick={addNewCustomChart}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar nuevo gráfico
            </Button>
            
            {editandoGraficoId && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-lg font-medium mb-4">Editar gráfico</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título del gráfico" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de gráfico</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="barras">Barras</SelectItem>
                                <SelectItem value="lineas">Líneas</SelectItem>
                                <SelectItem value="area">Área</SelectItem>
                                <SelectItem value="pastel">Pastel</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="datos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuente de datos</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar datos" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="actividades">Actividades</SelectItem>
                                <SelectItem value="itrb">ITRB</SelectItem>
                                <SelectItem value="avance">Avance</SelectItem>
                                <SelectItem value="vencimientos">Vencimientos</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color principal</FormLabel>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-md border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input type="text" placeholder="#3b82f6" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelarEdicion}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Guardar cambios</Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700 mt-6">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
