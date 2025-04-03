
import React from "react";
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
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { formatXAxis, getAxisDates } from "./utils/dateUtils";
import GanttTooltip from "./GanttTooltip";
import { getColorByProgress } from "./utils/colorUtils";

interface BarData {
  id: string;
  nombre: string;
  sistema: string;
  subsistema: string;
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  progreso: number;
  tieneVencidos: boolean;
  tieneMCC: boolean;
  proyecto: string;
  color: string;
  itrbsAsociados: any[];
}

interface GanttBarChartProps {
  data: BarData[];
  currentStartDate: Date;
  currentEndDate: Date;
  zoomLevel: number;
  viewMode: "month" | "week" | "day";
  mostrarSubsistemas: boolean;
  mostrarLeyenda: boolean;
}

const GanttBarChart: React.FC<GanttBarChartProps> = ({
  data,
  currentStartDate,
  currentEndDate,
  zoomLevel,
  viewMode,
  mostrarSubsistemas,
  mostrarLeyenda,
}) => {
  // Función para generar los ticks del eje X basados en el rango de fechas
  const generateXAxisTicks = () => {
    const ticks = getAxisDates(currentStartDate, currentEndDate, viewMode).map(date => date.getTime());
    return ticks;
  };

  // Función para obtener el color de fondo de la barra según la actividad
  const getBarBackgroundColor = (activity: any) => {
    if (activity.tieneVencidos) return "#ef4444"; // Rojo para vencidos
    return activity.color || "#94a3b8"; // Color por defecto o el asignado
  };

  // Añadir índices para alternar colores de fondo por fila
  const dataWithRowIndex = data.map((item, index) => ({
    ...item,
    rowIndex: index
  }));

  return (
    <div className="flex-1 overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataWithRowIndex}
          layout="vertical"
          barCategoryGap={6 * zoomLevel}
          margin={{ top: 20, right: 30, left: 180, bottom: 20 }}
          className="gantt-chart"
        >
          <defs>
            <pattern id="completado" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="#22c55e" fillOpacity="0.8" />
            </pattern>
            <pattern id="en-curso" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="#f59e0b" fillOpacity="0.8" />
            </pattern>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          
          <XAxis
            dataKey="fechaInicio"
            type="number"
            domain={[currentStartDate.getTime(), currentEndDate.getTime()]}
            tickFormatter={(date) => formatXAxis(date, viewMode)}
            scale="time"
            ticks={generateXAxisTicks()}
            height={50}
            tickLine={true}
            axisLine={true}
            padding={{ left: 0, right: 0 }}
            tick={({ x, y, payload }) => {
              // Formato personalizado para las fechas en el eje X
              const date = new Date(payload.value);
              const dayNumber = format(date, 'd');
              const monthName = format(date, 'MMM', { locale: es });
              
              return (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={11}>
                    {dayNumber}
                  </text>
                  {(viewMode === "month" && parseInt(dayNumber) === 1) && (
                    <text x={0} y={0} dy={32} textAnchor="middle" fill="#666" fontSize={10}>
                      {monthName}
                    </text>
                  )}
                </g>
              );
            }}
          />
          
          <YAxis
            dataKey="nombre"
            type="category"
            width={180}
            tick={({ x, y, payload, index }) => {
              const activity = dataWithRowIndex.find(item => item.nombre === payload.value);
              if (!activity) return null;
              
              // Alternar colores de fondo para las filas
              const rowBackground = activity.rowIndex % 2 === 0 ? "#f8fafc" : "#f1f5f9";
              
              return (
                <g transform={`translate(${x},${y})`}>
                  <rect 
                    x={-180} 
                    y={-12} 
                    width={180} 
                    height={24} 
                    fill={rowBackground} 
                    className="dark:opacity-20"
                  />
                  <text x={-5} y={0} dy={4} textAnchor="end" fontSize={12} fill="#334155" className="dark:fill-white">
                    {payload.value}
                  </text>
                  {mostrarSubsistemas && (
                    <text x={-5} y={16} textAnchor="end" fontSize={10} fill="#64748b" className="dark:fill-gray-400">
                      {activity.sistema} / {activity.subsistema}
                    </text>
                  )}
                </g>
              );
            }}
          />
          
          <Tooltip content={<GanttTooltip mostrarSubsistemas={mostrarSubsistemas} />} />
          
          {mostrarLeyenda && (
            <Legend
              verticalAlign="bottom"
              height={36}
              layout="horizontal"
              align="center"
              wrapperStyle={{ paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}
              payload={[
                { value: 'Completado', type: 'rect', color: '#22c55e' },
                { value: 'En curso', type: 'rect', color: '#f59e0b' },
                { value: 'Vencido', type: 'rect', color: '#ef4444' },
                { value: 'Actividad', type: 'rect', color: '#94a3b8' }
              ]}
            />
          )}
          
          <ReferenceLine
            x={new Date().getTime()}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="3 3"
            label={{ 
              value: 'Hoy', 
              position: 'insideTopRight', 
              fill: '#ef4444',
              fontSize: 10,
              offset: 5
            }}
          />
          
          <Bar
            dataKey="duracion"
            name="Duración"
            minPointSize={2}
            barSize={20 * zoomLevel}
            shape={({ x, y, width, height, payload }: any) => {
              const actividad = payload;
              const fechaInicio = actividad.fechaInicio.getTime();
              const fechaFin = actividad.fechaFin.getTime();
              
              // Calcular posición y ancho de la barra en el rango visible
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
              
              // Determinar el color principal de la barra
              const baseColor = getBarBackgroundColor(actividad);
              
              return (
                <g>
                  {/* Barra principal */}
                  <rect
                    x={xStart}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill={baseColor}
                    rx={3}
                    ry={3}
                    stroke={actividad.tieneVencidos ? "#b91c1c" : "#475569"}
                    strokeWidth={1}
                  />
                  
                  {/* Barra de progreso */}
                  {actividad.progreso > 0 && (
                    <rect
                      x={xStart}
                      y={y}
                      width={barWidth * (actividad.progreso / 100)}
                      height={height}
                      fill={actividad.progreso === 100 ? "#22c55e" : "#f59e0b"}
                      rx={3}
                      ry={3}
                      fillOpacity={0.8}
                    />
                  )}
                  
                  {/* Texto de progreso dentro de la barra */}
                  {barWidth > 50 && (
                    <text
                      x={xStart + barWidth / 2}
                      y={y + height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                      fontWeight="bold"
                      fontSize={11}
                      stroke="#00000033"
                      strokeWidth={0.5}
                    >
                      {actividad.progreso}%
                    </text>
                  )}
                  
                  {/* Barra con patrones para indicadores especiales */}
                  {actividad.tieneMCC && (
                    <rect
                      x={xStart}
                      y={y}
                      width={4}
                      height={height}
                      fill="#3b82f6"
                    />
                  )}
                </g>
              );
            }}
          >
            {dataWithRowIndex.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GanttBarChart;
