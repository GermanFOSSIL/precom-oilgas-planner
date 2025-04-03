
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
  Download
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
  PieChart,
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

const CriticalPathView: React.FC = () => {
  const { itrbItems, actividades, proyectos, filtros } = useAppContext();
  
  // Refs for the charts we want to download
  const trendsChartRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  
  // Filtrar por proyecto si hay uno seleccionado
  const filtroProyecto = filtros.proyecto !== "todos" ? filtros.proyecto : null;
  
  // Obtener elementos vencidos
  const itemsVencidos = useMemo(() => {
    return itrbItems
      .filter(item => item.estado === "Vencido")
      .filter(item => !filtroProyecto || 
        actividades.find(a => a.id === item.actividadId)?.proyectoId === filtroProyecto
      )
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
      .sort((a, b) => b.diasRetraso - a.diasRetraso);
  }, [itrbItems, actividades, proyectos, filtroProyecto]);

  // Contabilizar ITRB en curso y completados
  const itemsEnFecha = useMemo(() => {
    return itrbItems
      .filter(item => item.estado === "Completado" || item.estado === "En curso")
      .filter(item => !filtroProyecto || 
        actividades.find(a => a.id === item.actividadId)?.proyectoId === filtroProyecto
      );
  }, [itrbItems, actividades, filtroProyecto]);

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
    const completados = itrbItems.filter(item => item.estado === "Completado" && 
      (!filtroProyecto || actividades.find(a => a.id === item.actividadId)?.proyectoId === filtroProyecto)).length;
    
    const enCurso = itrbItems.filter(item => item.estado === "En curso" && 
      (!filtroProyecto || actividades.find(a => a.id === item.actividadId)?.proyectoId === filtroProyecto)).length;
    
    const vencidos = itemsVencidos.length;
    
    return [
      { name: "Completados", value: completados, color: "#22c55e" },
      { name: "En curso", value: enCurso, color: "#f59e0b" },
      { name: "Vencidos", value: vencidos, color: "#ef4444" }
    ];
  }, [itrbItems, actividades, filtroProyecto, itemsVencidos]);

  // Agrupar por sistemas para ver distribución
  const sistemaConMasVencidos = useMemo(() => {
    const sistemas: {[key: string]: number} = {};
    
    itemsVencidos.forEach(item => {
      if (item.actividad) {
        const sistema = item.actividad.sistema;
        sistemas[sistema] = (sistemas[sistema] || 0) + 1;
      }
    });
    
    // Ordenar por cantidad
    return Object.entries(sistemas)
      .sort((a, b) => b[1] - a[1])
      .map(([sistema, cantidad]) => ({ sistema, cantidad }));
  }, [itemsVencidos]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 dark:bg-slate-800 dark:border-slate-700">
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
            <ChartContainer 
              config={{
                "1-7 días": { color: "#fbbf24" },
                "8-15 días": { color: "#fb923c" },
                "16-30 días": { color: "#f43f5e" },
                ">30 días": { color: "#ef4444" }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={datosTendencia}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                  <XAxis 
                    dataKey="nombre" 
                    className="dark:fill-slate-400"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis className="dark:fill-slate-400" />
                  <Tooltip content={<ChartTooltipContent />} />
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
            </ChartContainer>
          </CardContent>
        </Card>

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
                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={datosEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {datosEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
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

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            Ruta Crítica - Elementos Vencidos ({itemsVencidos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {itemsVencidos.map((item, idx) => (
                <div key={item.id} className="relative pl-8 pb-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700 last:border-0">
                  {/* Indicador de impacto */}
                  <div className={`absolute top-0 left-0 w-4 h-4 rounded-full ${getColorPorImpacto(item.impacto)}`}></div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                          {item.diasRetraso} {item.diasRetraso === 1 ? "día" : "días"} de retraso
                        </Badge>
                        <Badge variant="outline" className="dark:border-gray-600">
                          {item.impacto}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(item.fechaLimite).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">
                      {item.descripcion}
                    </h3>
                    
                    <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-3">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400 mr-2">
                        {item.proyecto?.titulo || "Proyecto sin asignar"}
                      </span>
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <span className="mr-2">{item.actividad?.sistema}</span>
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <span>{item.actividad?.subsistema}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        Progreso: {item.cantidadRealizada}/{item.cantidadTotal}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600"
                        onClick={() => {
                          // Aquí se podría implementar una acción para ir a editar el elemento
                          alert(`Ir a editar elemento vencido: ${item.id}`);
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
    </div>
  );
};

export default CriticalPathView;
