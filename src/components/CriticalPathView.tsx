
import React, { useState, useMemo, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  Filter,
  CalendarIcon,
  CheckCircle,
  Info,
  Download,
  BarChart4,
  PieChart
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CriticalPathView: React.FC = () => {
  const { itrbItems, actividades, proyectos, filtros } = useAppContext();
  
  // Estado para selección de vista
  const [vistaAgrupada, setVistaAgrupada] = useState<"proyecto" | "sistema" | "subsistema">("sistema");
  const [ordenarPor, setOrdenarPor] = useState<"retraso" | "impacto" | "fechaVencimiento">("retraso");
  const [mostrarCompletados, setMostrarCompletados] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<"list" | "chart">("list");
  
  // Refs para los gráficos que queremos descargar
  const trendsChartRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  
  // Filtrar por proyecto si hay uno seleccionado
  const filtroProyecto = filtros.proyecto !== "todos" ? filtros.proyecto : null;
  const filtroSistema = filtros.sistema;
  const filtroSubsistema = filtros.subsistema;
  
  // Obtener elementos vencidos
  const itemsVencidos = useMemo(() => {
    return itrbItems
      .filter(item => {
        // Filtrar por estado vencido o fecha límite pasada
        const fechaLimite = new Date(item.fechaLimite);
        const hoy = new Date();
        const esVencido = item.estado === "Vencido" || fechaLimite < hoy;
        
        // Si hay filtro de proyecto, verificar que la actividad pertenezca a ese proyecto
        const actividad = actividades.find(a => a.id === item.actividadId);
        let cumpleFiltros = true;
        
        if (filtroProyecto && actividad) {
          cumpleFiltros = actividad.proyectoId === filtroProyecto;
        }
        
        // Filtrar por sistema
        if (filtroSistema && actividad) {
          cumpleFiltros = cumpleFiltros && actividad.sistema === filtroSistema;
        }
        
        // Filtrar por subsistema
        if (filtroSubsistema && actividad) {
          cumpleFiltros = cumpleFiltros && actividad.subsistema === filtroSubsistema;
        }
        
        // Si mostrarCompletados es falso, excluir los completados
        if (!mostrarCompletados && item.estado === "Completado") {
          return false;
        }
        
        return esVencido && cumpleFiltros;
      })
      .map(item => {
        const actividad = actividades.find(a => a.id === item.actividadId);
        const proyecto = actividad 
          ? proyectos.find(p => p.id === actividad.proyectoId) 
          : null;
          
        // Calcular días de retraso
        const fechaLimite = new Date(item.fechaLimite);
        const hoy = new Date();
        const diasRetraso = Math.ceil((hoy.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...item,
          actividad,
          proyecto,
          diasRetraso: Math.max(0, diasRetraso),
          impacto: diasRetraso > 30 ? "Alto" : diasRetraso > 15 ? "Medio" : "Bajo"
        };
      })
      .sort((a, b) => {
        // Ordenar según criterio seleccionado
        switch (ordenarPor) {
          case "retraso":
            return b.diasRetraso - a.diasRetraso;
          case "impacto":
            const impactoValor = { "Alto": 3, "Medio": 2, "Bajo": 1 };
            return impactoValor[b.impacto as keyof typeof impactoValor] - impactoValor[a.impacto as keyof typeof impactoValor];
          case "fechaVencimiento":
            return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime();
          default:
            return b.diasRetraso - a.diasRetraso;
        }
      });
  }, [itrbItems, actividades, proyectos, filtroProyecto, filtroSistema, filtroSubsistema, mostrarCompletados, ordenarPor]);

  // Contabilizar ITRB en curso y completados
  const itemsEnFecha = useMemo(() => {
    return itrbItems
      .filter(item => (item.estado === "Completado" || item.estado === "En curso"))
      .filter(item => {
        const actividad = actividades.find(a => a.id === item.actividadId);
        let cumpleFiltros = true;
        
        if (filtroProyecto && actividad) {
          cumpleFiltros = actividad.proyectoId === filtroProyecto;
        }
        
        if (filtroSistema && actividad) {
          cumpleFiltros = cumpleFiltros && actividad.sistema === filtroSistema;
        }
        
        if (filtroSubsistema && actividad) {
          cumpleFiltros = cumpleFiltros && actividad.subsistema === filtroSubsistema;
        }
        
        return cumpleFiltros;
      });
  }, [itrbItems, actividades, filtroProyecto, filtroSistema, filtroSubsistema]);

  // Agrupar datos según la vista seleccionada
  const datosAgrupados = useMemo(() => {
    const grupos: Record<string, typeof itemsVencidos> = {};
    
    itemsVencidos.forEach(item => {
      if (!item.actividad) return;
      
      let claveAgrupacion = "";
      switch (vistaAgrupada) {
        case "proyecto":
          claveAgrupacion = item.proyecto?.titulo || "Sin proyecto";
          break;
        case "sistema":
          claveAgrupacion = item.actividad.sistema;
          break;
        case "subsistema":
          claveAgrupacion = `${item.actividad.sistema}: ${item.actividad.subsistema}`;
          break;
      }
      
      if (!grupos[claveAgrupacion]) {
        grupos[claveAgrupacion] = [];
      }
      
      grupos[claveAgrupacion].push(item);
    });
    
    return Object.entries(grupos)
      .map(([nombre, items]) => ({
        nombre,
        items,
        cantidadTotal: items.length,
        retrasoPromedio: Math.round(items.reduce((sum, item) => sum + item.diasRetraso, 0) / items.length || 0)
      }))
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal);
  }, [itemsVencidos, vistaAgrupada]);

  // Calcular datos para el gráfico de tendencia
  const datosTendencia = useMemo(() => {
    // Agrupar por días de retraso
    const grupos: {[key: string]: number} = {};
    
    itemsVencidos.forEach(item => {
      const rango = getRangoRetraso(item.diasRetraso);
      grupos[rango] = (grupos[rango] || 0) + 1;
    });
    
    // Convertir a formato para el gráfico
    return [
      { nombre: "1-7 días", cantidad: grupos["1-7"] || 0, color: "#fbbf24" },
      { nombre: "8-15 días", cantidad: grupos["8-15"] || 0, color: "#fb923c" },
      { nombre: "16-30 días", cantidad: grupos["16-30"] || 0, color: "#f43f5e" },
      { nombre: ">30 días", cantidad: grupos[">30"] || 0, color: "#ef4444" }
    ];
  }, [itemsVencidos]);

  // Datos para gráfico de estado
  const datosEstado = useMemo(() => {
    // Filtrar según vista seleccionada
    const filteredItems = itrbItems.filter(item => {
      const actividad = actividades.find(a => a.id === item.actividadId);
      if (!actividad) return false;
      
      let cumpleFiltros = true;
      
      if (filtroProyecto) {
        cumpleFiltros = actividad.proyectoId === filtroProyecto;
      }
      
      if (filtroSistema) {
        cumpleFiltros = cumpleFiltros && actividad.sistema === filtroSistema;
      }
      
      if (filtroSubsistema) {
        cumpleFiltros = cumpleFiltros && actividad.subsistema === filtroSubsistema;
      }
      
      return cumpleFiltros;
    });
    
    const completados = filteredItems.filter(item => item.estado === "Completado").length;
    const enCurso = filteredItems.filter(item => item.estado === "En curso").length;
    const vencidos = itemsVencidos.length;
    
    return [
      { name: "Completados", value: completados, color: "#22c55e" },
      { name: "En curso", value: enCurso, color: "#f59e0b" },
      { name: "Vencidos", value: vencidos, color: "#ef4444" }
    ];
  }, [itrbItems, actividades, filtroProyecto, filtroSistema, filtroSubsistema, itemsVencidos]);

  // Datos para gráfico agrupado
  const datosPorAgrupacion = useMemo(() => {
    return datosAgrupados.map(grupo => ({
      nombre: grupo.nombre,
      cantidad: grupo.cantidadTotal,
      retraso: grupo.retrasoPromedio,
      color: getColorPorRetraso(grupo.retrasoPromedio)
    })).slice(0, 8); // Limitar a los 8 grupos principales
  }, [datosAgrupados]);

  // Contar subsistemas vencidos
  const subsistemesVencidos = useMemo(() => {
    const subsistemas = new Set<string>();
    
    itemsVencidos.forEach(item => {
      if (item.actividad) {
        subsistemas.add(`${item.actividad.sistema}:${item.actividad.subsistema}`);
      }
    });
    
    return subsistemas.size;
  }, [itemsVencidos]);

  // Helper para calcular el rango de retraso
  function getRangoRetraso(dias: number): string {
    if (dias <= 7) return "1-7";
    if (dias <= 15) return "8-15";
    if (dias <= 30) return "16-30";
    return ">30";
  }

  // Color según impacto
  function getColorPorImpacto(impacto: string): string {
    switch (impacto) {
      case "Alto": return "bg-red-500";
      case "Medio": return "bg-orange-500";
      case "Bajo": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  }
  
  // Color según retraso promedio
  function getColorPorRetraso(retraso: number): string {
    if (retraso > 30) return "#ef4444";
    if (retraso > 15) return "#f97316";
    if (retraso > 7) return "#eab308";
    return "#84cc16";
  }
  
  // Función para descargar el gráfico como imagen
  const downloadChartAsImage = (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    
    try {
      // Usar html2canvas para capturar el gráfico
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(ref.current!).then(canvas => {
          // Crear un enlace de descarga
          const link = document.createElement('a');
          link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast.success("Gráfico descargado como imagen");
        });
      }).catch(err => {
        console.error("Error al cargar html2canvas:", err);
        toast.error("No se pudo descargar el gráfico. Intente nuevamente.");
      });
    } catch (error) {
      console.error("Error al descargar gráfico:", error);
      toast.error("Error al descargar el gráfico");
    }
  };

  // No hay elementos vencidos
  if (itemsVencidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 text-green-500 mb-4">
          <CheckCircle className="w-full h-full" />
        </div>
        <h2 className="text-xl font-semibold mb-2">¡No hay elementos vencidos!</h2>
        <p className="text-muted-foreground">
          Todos los ITR B están dentro de los plazos establecidos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={vistaAgrupada}
            onValueChange={(value: "proyecto" | "sistema" | "subsistema") => setVistaAgrupada(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proyecto">Agrupar por Proyecto</SelectItem>
              <SelectItem value="sistema">Agrupar por Sistema</SelectItem>
              <SelectItem value="subsistema">Agrupar por Subsistema</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={ordenarPor}
            onValueChange={(value: "retraso" | "impacto" | "fechaVencimiento") => setOrdenarPor(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retraso">Días de retraso</SelectItem>
              <SelectItem value="impacto">Impacto</SelectItem>
              <SelectItem value="fechaVencimiento">Fecha vencimiento</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant={mostrarCompletados ? "default" : "outline"} 
            size="sm"
            onClick={() => setMostrarCompletados(!mostrarCompletados)}
            className={mostrarCompletados ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {mostrarCompletados ? "Ocultar completados" : "Mostrar completados"}
          </Button>
        </div>
        
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "list" | "chart")}>
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="chart">Gráficos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`md:col-span-${selectedTab === "list" ? "1" : "2"} dark:bg-slate-800 dark:border-slate-700`}>
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Tendencia de elementos vencidos
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadChartAsImage(trendsChartRef, 'tendencia-vencidos')}
              className="flex items-center gap-1 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </Button>
          </CardHeader>
          <CardContent className="h-[300px]" ref={trendsChartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={datosTendencia}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                <XAxis 
                  dataKey="nombre" 
                  className="dark:fill-slate-400"
                  angle={0}
                  textAnchor="middle"
                  height={60}
                />
                <YAxis className="dark:fill-slate-400" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2 border rounded shadow-sm text-xs">
                          <p className="font-medium">{`${label}: ${payload[0].value}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  name="Cantidad"
                  stroke="#ef4444"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {selectedTab === "chart" && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle className="flex items-center text-lg">
                <BarChart4 className="mr-2 h-5 w-5 text-blue-500" />
                {vistaAgrupada === "proyecto" 
                  ? "ITR B por Proyecto" 
                  : vistaAgrupada === "sistema" 
                    ? "ITR B por Sistema" 
                    : "ITR B por Subsistema"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={datosPorAgrupacion}
                    margin={{ top: 5, right: 5, bottom: 25, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                    <XAxis 
                      dataKey="nombre" 
                      className="dark:fill-slate-400"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="dark:fill-slate-400" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-slate-800 p-2 border rounded shadow-sm text-xs">
                              <p className="font-medium mb-1">{label}</p>
                              <p>Cantidad: {payload[0].value}</p>
                              <p>Retraso promedio: {payload[1].value} días</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      name="Cantidad"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="retraso"
                      name="Retraso (días)"
                      stroke="#ef4444"
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Estado de ITR B
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resumen de ITR B por estado</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadChartAsImage(statusChartRef, 'estado-itrb')}
                className="flex items-center gap-1 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar
              </Button>
            </div>
          </CardHeader>
          <CardContent ref={statusChartRef}>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={datosEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {datosEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                <span>ITR B Vencidos:</span>
                <Badge variant="destructive">{itemsVencidos.length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                <span>Subsistemas Afectados:</span>
                <Badge variant="destructive">{subsistemesVencidos}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                <span>ITR B En Fecha:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
                  {itemsEnFecha.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TabsContent value="list" className="mt-4 space-y-6">
        {datosAgrupados.map((grupo, grupoIndex) => (
          <Card key={grupo.nombre} className="dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            <CardHeader className="bg-slate-100 dark:bg-slate-700 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2`} style={{ backgroundColor: getColorPorRetraso(grupo.retrasoPromedio) }}></div>
                  <CardTitle className="text-lg font-bold">
                    {grupo.nombre}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {grupo.cantidadTotal} ITR B
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Retraso promedio: {grupo.retrasoPromedio} días
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[grupo.items.length > 3 ? '300px' : 'auto']">
                <div className="space-y-2 p-4">
                  {grupo.items.map((item, idx) => (
                    <div key={item.id} className="relative pl-6 pb-4 border-l-2 border-dashed border-gray-200 dark:border-gray-700 last:border-0">
                      {/* Indicador de impacto */}
                      <div className={`absolute top-0 left-0 w-3 h-3 rounded-full ${getColorPorImpacto(item.impacto)}`}></div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                              {item.diasRetraso} {item.diasRetraso === 1 ? "día" : "días"} de retraso
                            </Badge>
                            <Badge variant="outline" className="dark:border-gray-600">
                              {item.impacto}
                            </Badge>
                            {item.estado === "Completado" && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                                Completado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(item.fechaLimite).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-base mb-1 break-words">
                          {item.descripcion}
                        </h3>
                        
                        <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-3 gap-1">
                          {vistaAgrupada !== "proyecto" && (
                            <>
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                {item.proyecto?.titulo || "Proyecto sin asignar"}
                              </span>
                              <ArrowRight className="h-3 w-3 mx-1" />
                            </>
                          )}
                          {vistaAgrupada !== "sistema" && vistaAgrupada !== "subsistema" && (
                            <>
                              <span>{item.actividad?.sistema}</span>
                              <ArrowRight className="h-3 w-3 mx-1" />
                            </>
                          )}
                          {vistaAgrupada !== "subsistema" && (
                            <span>{item.actividad?.subsistema}</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="text-sm">
                            Progreso: {item.cantidadRealizada}/{item.cantidadTotal}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600"
                            onClick={() => {
                              // Aquí se podría implementar una acción para ir a editar el elemento
                              toast.info(`Ver detalle de ${item.descripcion}`);
                            }}
                          >
                            Ver detalle
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      
      <TabsContent value="chart" className="mt-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChart className="mr-2 h-5 w-5 text-purple-500" />
              Distribución de ITR B por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={datosEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {datosEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
};

export default CriticalPathView;
