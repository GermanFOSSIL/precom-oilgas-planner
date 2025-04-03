import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiltrosDashboard, ConfiguracionGrafico } from "@/types";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedGanttChartProps {
  filtros: FiltrosDashboard;
  configuracion: ConfiguracionGrafico;
}

const EnhancedGanttChart: React.FC<EnhancedGanttChartProps> = ({ 
  filtros, 
  configuracion 
}) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date());
  const [currentEndDate, setCurrentEndDate] = useState<Date>(addDays(new Date(), 30));
  
  // Determinar si mostrar subsistemas basado en la configuración
  const mostrarSubsistemas = configuracion.mostrarSubsistemas !== undefined 
    ? configuracion.mostrarSubsistemas 
    : true;

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filtrar actividades según los filtros aplicados
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(actividad => {
      // Filtrar por proyecto
      if (filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
        return false;
      }
      
      // Filtrar por sistema
      if (filtros.sistema && filtros.sistema !== "todos" && actividad.sistema !== filtros.sistema) {
        return false;
      }
      
      // Filtrar por subsistema
      if (filtros.subsistema && filtros.subsistema !== "todos" && actividad.subsistema !== filtros.subsistema) {
        return false;
      }
      
      // Filtrar por búsqueda de actividad o código ITR
      if (filtros.busquedaActividad) {
        const busquedaMinuscula = filtros.busquedaActividad.toLowerCase();
        
        // Buscar en el nombre de la actividad
        if (actividad.nombre.toLowerCase().includes(busquedaMinuscula)) {
          return true;
        }
        
        // Buscar en los ITRs asociados a esta actividad
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => 
          itrb.descripcion.toLowerCase().includes(busquedaMinuscula)
        );
      }
      
      // Filtrar por estado de ITRB
      if (filtros.estadoITRB && filtros.estadoITRB !== "todos") {
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => itrb.estado === filtros.estadoITRB);
      }
      
      // Filtrar por tareas vencidas
      if (filtros.tareaVencida) {
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => itrb.estado === "Vencido");
      }
      
      // Filtrar por CCC
      if (filtros.ccc) {
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => itrb.ccc);
      }
      
      return true;
    });
  }, [actividades, itrbItems, filtros]);

  // Preparar datos para el gráfico de Gantt
  const ganttData = useMemo(() => {
    return actividadesFiltradas.map(actividad => {
      const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
      const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
      
      // Calcular progreso
      const totalItrb = itrbsAsociados.length;
      const completados = itrbsAsociados.filter(itrb => itrb.estado === "Completado").length;
      const progreso = totalItrb > 0 ? (completados / totalItrb) * 100 : 0;
      
      // Verificar si hay ITRBs vencidos
      const tieneVencidos = itrbsAsociados.some(itrb => itrb.estado === "Vencido");
      
      // Verificar si hay ITRBs CCC
      const tieneCCC = itrbsAsociados.some(itrb => itrb.ccc);
      
      // Calcular fechas para el gráfico
      const fechaInicio = new Date(actividad.fechaInicio);
      const fechaFin = new Date(actividad.fechaFin);
      
      return {
        id: actividad.id,
        nombre: actividad.nombre,
        sistema: actividad.sistema,
        subsistema: actividad.subsistema,
        fechaInicio,
        fechaFin,
        duracion: actividad.duracion,
        progreso,
        tieneVencidos,
        tieneCCC,
        proyecto: proyecto?.titulo || "Sin proyecto",
        color: getColorByProgress(progreso, tieneVencidos),
        itrbsAsociados
      };
    });
  }, [actividadesFiltradas, proyectos, itrbItems]);

  // Función para obtener color según progreso
  const getColorByProgress = (progreso: number, tieneVencidos: boolean): string => {
    if (tieneVencidos) return "#ef4444"; // Rojo para vencidos
    if (progreso === 100) return "#22c55e"; // Verde para completados
    if (progreso > 0) return "#f59e0b"; // Amarillo para en progreso
    return "#94a3b8"; // Gris para no iniciados
  };

  // Función para formatear fechas en el eje X
  const formatXAxis = (date: number) => {
    const dateObj = new Date(date);
    switch (viewMode) {
      case "day":
        return format(dateObj, "dd MMM", { locale: es });
      case "week":
        return format(dateObj, "dd MMM", { locale: es });
      case "month":
      default:
        return format(dateObj, "MMM yyyy", { locale: es });
    }
  };

  // Función para generar las fechas del eje X
  const getAxisDates = () => {
    const dates: Date[] = [];
    let currentDate = new Date(currentStartDate);
    
    while (currentDate <= currentEndDate) {
      dates.push(new Date(currentDate));
      
      switch (viewMode) {
        case "day":
          currentDate = addDays(currentDate, 1);
          break;
        case "week":
          currentDate = addDays(currentDate, 7);
          break;
        case "month":
        default:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    
    return dates;
  };

  // Función para navegar en el tiempo
  const navigateTime = (direction: "prev" | "next") => {
    let newStartDate, newEndDate;
    
    switch (viewMode) {
      case "day":
        newStartDate = direction === "prev" 
          ? addDays(currentStartDate, -7) 
          : addDays(currentStartDate, 7);
        newEndDate = direction === "prev" 
          ? addDays(currentEndDate, -7) 
          : addDays(currentEndDate, 7);
        break;
      case "week":
        newStartDate = direction === "prev" 
          ? addDays(currentStartDate, -28) 
          : addDays(currentStartDate, 28);
        newEndDate = direction === "prev" 
          ? addDays(currentEndDate, -28) 
          : addDays(currentEndDate, 28);
        break;
      case "month":
      default:
        newStartDate = new Date(currentStartDate);
        newEndDate = new Date(currentEndDate);
        if (direction === "prev") {
          newStartDate.setMonth(newStartDate.getMonth() - 3);
          newEndDate.setMonth(newEndDate.getMonth() - 3);
        } else {
          newStartDate.setMonth(newStartDate.getMonth() + 3);
          newEndDate.setMonth(newEndDate.getMonth() + 3);
        }
        break;
    }
    
    setCurrentStartDate(newStartDate);
    setCurrentEndDate(newEndDate);
  };

  // Función para cambiar el nivel de zoom
  const changeZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 2) {
      setZoomLevel(zoomLevel + 0.25);
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.25);
    }
  };

  // Personalizar el tooltip del gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <Card className="p-0 shadow-lg border-0">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="font-medium">{data.nombre}</div>
              <div className="text-sm text-muted-foreground">
                {data.sistema} {mostrarSubsistemas ? `/ ${data.subsistema}` : ''}
              </div>
              <div className="text-xs">
                <span className="font-medium">Duración:</span> {data.duracion} días
              </div>
              <div className="text-xs">
                <span className="font-medium">Inicio:</span> {format(data.fechaInicio, "dd/MM/yyyy")}
              </div>
              <div className="text-xs">
                <span className="font-medium">Fin:</span> {format(data.fechaFin, "dd/MM/yyyy")}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Progreso:</span>
                <Progress value={data.progreso} className="h-2 w-24" />
                <span className="text-xs">{Math.round(data.progreso)}%</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.tieneVencidos && (
                  <Badge variant="destructive" className="text-xs">Vencido</Badge>
                )}
                {data.tieneCCC && (
                  <Badge className="bg-blue-500 text-xs">CCC</Badge>
                )}
                {data.progreso === 100 && (
                  <Badge className="bg-green-500 text-xs">Completado</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  // Si está cargando, mostrar esqueleto
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 px-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-60" />
        </div>
        <div className="flex-1">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (ganttData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No hay actividades para mostrar</h3>
          <p className="text-muted-foreground">
            Ajusta los filtros o agrega nuevas actividades
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gantt-chart-container">
      <div className="flex justify-between items-center mb-4 px-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateTime("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateTime("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentStartDate, "MMM yyyy", { locale: es })} - {format(currentEndDate, "MMM yyyy", { locale: es })}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as "month" | "week" | "day")}
            className="mr-2"
          >
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-2 h-6">Mes</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2 h-6">Semana</TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-2 h-6">Día</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => changeZoom("in")}
                  disabled={zoomLevel >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aumentar zoom</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => changeZoom("out")}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reducir zoom</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ganttData}
            layout="vertical"
            barCategoryGap={4 * zoomLevel}
            margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fechaInicio" 
              type="number" 
              domain={[currentStartDate.getTime(), currentEndDate.getTime()]} 
              tickFormatter={formatXAxis}
              scale="time"
              ticks={getAxisDates().map(date => date.getTime())}
            />
            <YAxis 
              dataKey="nombre" 
              type="category" 
              width={150}
              tick={({ x, y, payload }) => {
                const actividad = ganttData.find(item => item.nombre === payload.value);
                if (!actividad) return null;
                
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={-3} y={0} dy={4} textAnchor="end" fontSize={12} fill="#666">
                      {payload.value}
                    </text>
                    {mostrarSubsistemas && (
                      <text x={-3} y={16} textAnchor="end" fontSize={10} fill="#999">
                        {actividad.sistema} / {actividad.subsistema}
                      </text>
                    )}
                  </g>
                );
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {configuracion.mostrarLeyenda && (
              <Legend 
                verticalAlign="top" 
                height={36}
                payload={[
                  { value: 'Completado', type: 'rect', color: '#22c55e' },
                  { value: 'En progreso', type: 'rect', color: '#f59e0b' },
                  { value: 'Vencido', type: 'rect', color: '#ef4444' },
                  { value: 'No iniciado', type: 'rect', color: '#94a3b8' }
                ]}
              />
            )}
            <ReferenceLine x={new Date().getTime()} stroke="#ef4444" strokeWidth={2} label={{ value: 'Hoy', position: 'insideTopRight', fill: '#ef4444' }} />
            <Bar 
              dataKey="duracion" 
              name="Duración" 
              minPointSize={2}
              barSize={20 * zoomLevel}
              shape={({ x, y, width, height, payload }: any) => {
                const actividad = payload;
                const fechaInicio = actividad.fechaInicio.getTime();
                const fechaFin = actividad.fechaFin.getTime();
                
                // Calcular posición y ancho basado en fechas
                const xStart = Math.max(
                  x, 
                  (fechaInicio - currentStartDate.getTime()) / 
                  (currentEndDate.getTime() - currentStartDate.getTime()) * width + x
                );
                
                const xEnd = Math.min(
                  x + width,
                  (fechaFin - currentStartDate.getTime()) / 
                  (currentEndDate.getTime() - currentStartDate.getTime()) * width + x
                );
                
                const barWidth = Math.max(xEnd - xStart, 2);
                
                return (
                  <g>
                    <rect 
                      x={xStart} 
                      y={y} 
                      width={barWidth} 
                      height={height} 
                      fill={actividad.color} 
                      rx={2} 
                      ry={2}
                    />
                    {actividad.progreso > 0 && actividad.progreso < 100 && (
                      <rect 
                        x={xStart} 
                        y={y} 
                        width={barWidth * (actividad.progreso / 100)} 
                        height={height} 
                        fill={actividad.tieneVencidos ? "#fecaca" : "#86efac"} 
                        rx={2} 
                        ry={2}
                        fillOpacity={0.7}
                      />
                    )}
                  </g>
                );
              }}
            >
              {ganttData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnhancedGanttChart;
