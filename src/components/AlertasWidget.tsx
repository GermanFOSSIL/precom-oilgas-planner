
import React from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const AlertasWidget: React.FC = () => {
  const { alertas, markAlertaAsRead, filtros } = useAppContext();

  // Filtrar alertas por proyecto si es necesario
  const alertasFiltradas = filtros.proyecto !== "todos"
    ? alertas.filter(alerta => alerta.proyectoId === filtros.proyecto)
    : alertas;

  // Mostrar las 5 alertas más recientes no leídas
  const alertasRecientes = alertasFiltradas
    .filter(alerta => !alerta.leida)
    .sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    )
    .slice(0, 5);

  const getIconoAlerta = (tipo: string) => {
    switch (tipo) {
      case "Vencimiento": return <AlertCircle className="text-red-500 h-5 w-5" />;
      case "CCC Pendiente": return <Clock className="text-amber-500 h-5 w-5" />;
      case "Falta Ejecución": return <AlertCircle className="text-amber-500 h-5 w-5" />;
      default: return <AlertCircle className="text-gray-500 h-5 w-5" />;
    }
  };

  const formatearFecha = (fechaIso: string) => {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (alertasRecientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="text-green-500 h-5 w-5 mr-2" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            No hay alertas pendientes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
          Alertas ({alertasRecientes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {alertasRecientes.map((alerta) => (
              <div 
                key={alerta.id} 
                className="p-3 border rounded-md bg-gray-50 dark:bg-slate-800"
              >
                <div className="flex items-start gap-2">
                  {getIconoAlerta(alerta.tipo)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alerta.mensaje}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(alerta.fechaCreacion)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markAlertaAsRead(alerta.id)}
                  >
                    Marcar como leída
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AlertasWidget;
