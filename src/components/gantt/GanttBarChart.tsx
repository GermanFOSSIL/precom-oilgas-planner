
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
import { format } from "date-fns";
import { formatXAxis, getAxisDates } from "./utils/dateUtils";
import GanttTooltip from "./GanttTooltip";

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
  return (
    <div className="flex-1 overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap={4 * zoomLevel}
          margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fechaInicio"
            type="number"
            domain={[currentStartDate.getTime(), currentEndDate.getTime()]}
            tickFormatter={(date) => formatXAxis(date, viewMode)}
            scale="time"
            ticks={getAxisDates(currentStartDate, currentEndDate, viewMode).map(date => date.getTime())}
          />
          <YAxis
            dataKey="nombre"
            type="category"
            width={150}
            tick={({ x, y, payload }) => {
              const actividad = data.find(item => item.nombre === payload.value);
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
          <Tooltip content={<GanttTooltip mostrarSubsistemas={mostrarSubsistemas} />} />
          {mostrarLeyenda && (
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
          <ReferenceLine
            x={new Date().getTime()}
            stroke="#ef4444"
            strokeWidth={2}
            label={{ value: 'Hoy', position: 'insideTopRight', fill: '#ef4444' }}
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
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GanttBarChart;
