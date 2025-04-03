
import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TooltipData {
  nombre: string;
  sistema: string;
  subsistema: string;
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  progreso: number;
  tieneVencidos: boolean;
  tieneMCC: boolean;
}

interface GanttTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  mostrarSubsistemas: boolean;
}

const GanttTooltip: React.FC<GanttTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  mostrarSubsistemas 
}) => {
  if (active && payload && payload.length) {
    const data: TooltipData = payload[0].payload;
    
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
              {data.tieneMCC && (
                <Badge className="bg-blue-500 text-xs">MCC</Badge>
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

export default GanttTooltip;
