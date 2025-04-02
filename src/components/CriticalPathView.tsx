
import React, { useState, useMemo } from "react";
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
  CalendarIcon
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
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

const CriticalPathView: React.FC = () => {
  const { itrbItems, actividades, proyectos } = useAppContext();
  const [filtroProyecto, setFiltroProyecto] = useState<string | null>(null);
  
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

  // No hay elementos vencidos
  if (itemsVencidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 text-green-500 mb-4">
          <CheckCircleIcon className="w-full h-full" />
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
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Tendencia de elementos vencidos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Sistemas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-4">
                {sistemaConMasVencidos.slice(0, 6).map((sistema, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{sistema.sistema}</div>
                      <div className="text-sm text-muted-foreground">
                        {sistema.cantidad} {sistema.cantidad === 1 ? "elemento" : "elementos"}
                      </div>
                    </div>
                    <Badge variant={idx < 3 ? "destructive" : "outline"}>
                      {sistema.cantidad}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                <div key={item.id} className="relative pl-8 pb-6 border-l-2 border-dashed border-gray-200 last:border-0">
                  {/* Indicador de impacto */}
                  <div className={`absolute top-0 left-0 w-4 h-4 rounded-full ${getColorPorImpacto(item.impacto)}`}></div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {item.diasRetraso} {item.diasRetraso === 1 ? "día" : "días"} de retraso
                        </Badge>
                        <Badge variant="outline">
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
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {item.proyecto?.titulo || "Proyecto sin asignar"}
                      </span>
                      <ArrowRight className="h-3 w-3 mx-2" />
                      <span>{item.actividad?.sistema}</span>
                      <ArrowRight className="h-3 w-3 mx-2" />
                      <span>{item.actividad?.subsistema}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        Progreso: {item.cantidadRealizada}/{item.cantidadTotal}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
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

// Componente ícono que no está definido en lucide-react
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default CriticalPathView;
