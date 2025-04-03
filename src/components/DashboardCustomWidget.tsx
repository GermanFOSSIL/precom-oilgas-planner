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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash, Maximize, Minimize } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraficoPersonalizado, FiltrosDashboard } from "@/types";
import { toast } from "sonner";

interface DashboardCustomWidgetProps {
  widget: GraficoPersonalizado;
  onEdit: () => void;
  onRemove: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}

const DashboardCustomWidget: React.FC<DashboardCustomWidgetProps> = ({
  widget,
  onEdit,
  onRemove,
  onMaximize,
  isMaximized,
}) => {
  const { actividades, itrbItems, proyectos, getKPIs } = useAppContext();

  const chartData = useMemo(() => {
    switch (widget.datos) {
      case "avance":
        // Agrupar por proyecto y calcular el avance
        const proyectosAgrupados = proyectos.map(proyecto => {
          const actividadesProyecto = actividades.filter(actividad => actividad.proyectoId === proyecto.id);
          const totalITRB = actividadesProyecto.reduce((total, actividad) => {
            return total + itrbItems.filter(itrb => itrb.actividadId === actividad.id).length;
          }, 0);
          const completadosITRB = actividadesProyecto.reduce((total, actividad) => {
            return total + itrbItems.filter(itrb => itrb.actividadId === actividad.id && itrb.estado === "Completado").length;
          }, 0);

          const avance = totalITRB > 0 ? (completadosITRB / totalITRB) * 100 : 0;
          return {
            name: proyecto.titulo,
            avance: avance,
            totalITRB,
            completadosITRB
          };
        });
        return proyectosAgrupados;

      case "itrb":
        // Agrupar por estado de ITRB
        const estadosAgrupados = itrbItems.reduce((acc: any, itrb) => {
          const estado = itrb.estado;
          acc[estado] = (acc[estado] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(estadosAgrupados).map(([name, value]: [string, any]) => ({
          name,
          value
        }));

      case "actividades":
        // Agrupar por sistema
        const sistemasAgrupados = actividades.reduce((acc: any, actividad) => {
          const sistema = actividad.sistema;
          acc[sistema] = (acc[sistema] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(sistemasAgrupados).map(([name, value]: [string, any]) => ({
          name,
          value
        }));

      case "vencimientos":
        // Agrupar por mes de fecha límite de ITRB
        const vencimientosAgrupados = itrbItems.reduce((acc: any, itrb) => {
          const fecha = new Date(itrb.fechaLimite);
          const mes = fecha.toLocaleString('default', { month: 'long' });
          acc[mes] = (acc[mes] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(vencimientosAgrupados).map(([name, value]: [string, any]) => ({
          name,
          value
        }));

      default:
        return [];
    }
  }, [actividades, itrbItems, proyectos, widget.datos]);

  const renderChart = () => {
    switch (widget.tipo) {
      case "barras":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avance" fill={widget.color} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "lineas":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={widget.color} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pastel":
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill={widget.color}
                label
              >
                {
                  chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))
                }
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke={widget.color} fill={widget.color} />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <p>Tipo de gráfico no soportado</p>;
    }
  };

  return (
    <Card className={`w-full ${isMaximized ? 'col-span-2' : ''}`}>
      <CardHeader>
        <CardTitle>{widget.titulo}</CardTitle>
        <CardDescription>
          Visualización personalizada de datos del proyecto
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {renderChart()}
      </CardContent>
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove}>
              <Trash className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onMaximize}>
              {isMaximized ? (
                <>
                  <Minimize className="mr-2 h-4 w-4" />
                  Restaurar
                </>
              ) : (
                <>
                  <Maximize className="mr-2 h-4 w-4" />
                  Maximizar
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default DashboardCustomWidget;
