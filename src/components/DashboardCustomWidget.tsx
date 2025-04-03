
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraficoPersonalizado } from "@/types";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Settings, Maximize2, Minimize2, X, Move, BarChart4, PieChart, LineChart as LineChartIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDrag } from "@use-gesture/react";

interface DashboardCustomWidgetProps {
  widget: GraficoPersonalizado;
  onEdit?: () => void;
  onRemove?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const DashboardCustomWidget: React.FC<DashboardCustomWidgetProps> = ({ 
  widget, 
  onEdit, 
  onRemove,
  onMaximize,
  isMaximized = false
}) => {
  const { actividades, itrbItems, proyectos } = useAppContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Datos para los gráficos
  const getData = () => {
    switch (widget.datos) {
      case "avance":
        // Datos de avance por proyecto/sistema
        return proyectos.map(proyecto => {
          const actividadesProyecto = actividades.filter(a => a.proyectoId === proyecto.id);
          const itrbsProyecto = itrbItems.filter(i => {
            const actividad = actividades.find(a => a.id === i.actividadId);
            return actividad && actividad.proyectoId === proyecto.id;
          });
          
          const totalItrbs = itrbsProyecto.length;
          const completados = itrbsProyecto.filter(i => i.estado === "Completado").length;
          const porcentaje = totalItrbs > 0 ? (completados / totalItrbs) * 100 : 0;
          
          return {
            name: proyecto.titulo,
            value: Math.round(porcentaje),
            actividades: actividadesProyecto.length,
            itrbs: totalItrbs,
            completados
          };
        });
        
      case "itrb":
        // Datos de ITRBs por estado
        const estadosCount = { Completado: 0, "En curso": 0, Vencido: 0 };
        itrbItems.forEach(itrb => {
          estadosCount[itrb.estado as keyof typeof estadosCount]++;
        });
        
        return [
          { name: "Completados", value: estadosCount.Completado, color: "#22c55e" },
          { name: "En curso", value: estadosCount["En curso"], color: "#f59e0b" },
          { name: "Vencidos", value: estadosCount.Vencido, color: "#ef4444" }
        ];
        
      case "actividades":
        // Datos de actividades por sistema
        const sistemaCount: Record<string, number> = {};
        actividades.forEach(act => {
          sistemaCount[act.sistema] = (sistemaCount[act.sistema] || 0) + 1;
        });
        
        return Object.entries(sistemaCount).map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }));
        
      case "vencimientos":
        // Datos de vencimientos por mes
        const now = new Date();
        const monthsData: Record<string, { vencidos: number, proximos: number }> = {};
        
        // Inicializar los próximos 6 meses
        for (let i = 0; i < 6; i++) {
          const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const monthKey = month.toLocaleString('default', { month: 'short', year: 'numeric' });
          monthsData[monthKey] = { vencidos: 0, proximos: 0 };
        }
        
        // Contar ITRBs por mes de vencimiento
        itrbItems.forEach(itrb => {
          const fechaLimite = new Date(itrb.fechaLimite);
          const monthKey = fechaLimite.toLocaleString('default', { month: 'short', year: 'numeric' });
          
          if (monthsData[monthKey]) {
            if (fechaLimite < now && itrb.estado !== "Completado") {
              monthsData[monthKey].vencidos++;
            } else {
              monthsData[monthKey].proximos++;
            }
          }
        });
        
        return Object.entries(monthsData).map(([name, data]) => ({
          name,
          Vencidos: data.vencidos,
          Próximos: data.proximos
        }));
        
      default:
        return [];
    }
  };
  
  // Renderizar el gráfico según el tipo
  const renderChart = () => {
    const data = getData();
    const height = isMaximized ? 500 : 300;
    
    switch (widget.tipo) {
      case "barras":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="name" 
                className="dark:fill-slate-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="dark:fill-slate-400" />
              <Tooltip />
              <Legend />
              {widget.datos === "vencimientos" ? (
                <>
                  <Bar dataKey="Vencidos" fill="#ef4444" />
                  <Bar dataKey="Próximos" fill="#3b82f6" />
                </>
              ) : (
                <Bar 
                  dataKey="value" 
                  fill={widget.color || "#3b82f6"}
                  name={widget.datos === "avance" ? "Avance (%)" : "Cantidad"}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case "lineas":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="name" 
                className="dark:fill-slate-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="dark:fill-slate-400" />
              <Tooltip />
              <Legend />
              {widget.datos === "vencimientos" ? (
                <>
                  <Line type="monotone" dataKey="Vencidos" stroke="#ef4444" />
                  <Line type="monotone" dataKey="Próximos" stroke="#3b82f6" />
                </>
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={widget.color || "#3b82f6"}
                  name={widget.datos === "avance" ? "Avance (%)" : "Cantidad"}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case "pastel":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={isMaximized ? 180 : 100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
        
      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="name" 
                className="dark:fill-slate-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="dark:fill-slate-400" />
              <Tooltip />
              <Legend />
              {widget.datos === "vencimientos" ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="Vencidos" 
                    stroke="#ef4444"
                    fill="#ef444455"
                    fillOpacity={0.3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Próximos" 
                    stroke="#3b82f6"
                    fill="#3b82f655"
                    fillOpacity={0.3}
                  />
                </>
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={widget.color || "#3b82f6"}
                  fill={widget.color ? `${widget.color}55` : "#3b82f655"}
                  fillOpacity={0.3}
                  name={widget.datos === "avance" ? "Avance (%)" : "Cantidad"}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Tipo de gráfico no soportado</div>;
    }
  };
  
  // Obtener el ícono según el tipo de gráfico
  const getChartIcon = () => {
    switch (widget.tipo) {
      case "barras":
        return <BarChart4 className="h-5 w-5 mr-2" />;
      case "pastel":
        return <PieChart className="h-5 w-5 mr-2" />;
      case "lineas":
      case "area":
        return <LineChartIcon className="h-5 w-5 mr-2" />;
      default:
        return <BarChart4 className="h-5 w-5 mr-2" />;
    }
  };
  
  // Drag handler para mover el widget
  const bindDrag = useDrag(({ movement: [x, y], first, last }) => {
    if (first) {
      const startPos = { ...position };
      setPosition(startPos);
    }
    
    if (!last) {
      setPosition({ x, y });
    }
  });
  
  return (
    <Card 
      className={`dark:bg-slate-800 dark:border-slate-700 ${isMaximized ? "fixed inset-10 z-50" : "relative"}`}
      style={isMaximized ? {} : { transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          {getChartIcon()}
          <CardTitle>{widget.titulo}</CardTitle>
        </div>
        
        <div className="flex items-center gap-1">
          {!isMaximized && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 cursor-move"
              {...bindDrag()}
            >
              <Move className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                Editar widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-red-600 dark:text-red-400">
                Eliminar widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onMaximize}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          {isMaximized && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onMaximize}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {renderChart()}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground justify-end pt-0">
        {widget.datos === "avance" && "Datos de avance por proyecto"}
        {widget.datos === "itrb" && "Distribución de ITR B por estado"}
        {widget.datos === "actividades" && "Actividades por sistema"}
        {widget.datos === "vencimientos" && "Próximos vencimientos"}
      </CardFooter>
    </Card>
  );
};

export default DashboardCustomWidget;
