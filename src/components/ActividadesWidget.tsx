
import React, { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ArrowRight, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Actividad, ITRB } from "@/types";

interface ActividadesWidgetProps {
  maxItems?: number;
}

const ActividadesWidget: React.FC<ActividadesWidgetProps> = ({ maxItems = 5 }) => {
  const { actividades, itrbItems, proyectos, filtros } = useAppContext();
  
  // Filtrar las actividades según los filtros aplicados
  const actividadesFiltradas = useMemo(() => {
    let filtered = actividades;
    
    // Filtrar por proyecto
    if (filtros.proyecto !== "todos") {
      filtered = filtered.filter(act => act.proyectoId === filtros.proyecto);
    }
    
    // Filtrar por sistema
    if (filtros.sistema) {
      filtered = filtered.filter(act => act.sistema === filtros.sistema);
    }
    
    // Filtrar por subsistema
    if (filtros.subsistema) {
      filtered = filtered.filter(act => act.subsistema === filtros.subsistema);
    }
    
    // Filtrar por búsqueda
    if (filtros.busquedaActividad) {
      const search = filtros.busquedaActividad.toLowerCase();
      filtered = filtered.filter(act => 
        act.nombre.toLowerCase().includes(search) ||
        act.sistema.toLowerCase().includes(search) ||
        act.subsistema.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [actividades, filtros]);
  
  // Enriquecer las actividades con información adicional
  const actividadesConInfo = useMemo(() => {
    return actividadesFiltradas.map(actividad => {
      // Obtener ITRBs asociados
      const itrbs = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
      
      // Calcular progreso
      const totalITRBs = itrbs.length;
      const completados = itrbs.filter(itrb => itrb.estado === "Completado").length;
      const vencidos = itrbs.filter(itrb => itrb.estado === "Vencido").length;
      const progreso = totalITRBs > 0 ? (completados / totalITRBs) * 100 : 0;
      
      // Verificar fechas
      const fechaInicio = new Date(actividad.fechaInicio);
      const fechaFin = new Date(actividad.fechaFin);
      const hoy = new Date();
      
      // Calcular estado de la actividad
      let estado: "pendiente" | "en-curso" | "completada" | "vencida" = "pendiente";
      
      if (fechaInicio > hoy) {
        estado = "pendiente";
      } else if (fechaFin < hoy && progreso < 100) {
        estado = "vencida";
      } else if (progreso === 100) {
        estado = "completada";
      } else {
        estado = "en-curso";
      }
      
      // Obtener nombre del proyecto
      const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
      
      return {
        ...actividad,
        itrbs,
        totalITRBs,
        completados,
        vencidos,
        progreso,
        estado,
        proyectoNombre: proyecto?.titulo || "Sin proyecto"
      };
    })
    .sort((a, b) => {
      // Ordenar primero por estado (vencidas primero)
      if (a.estado === "vencida" && b.estado !== "vencida") return -1;
      if (a.estado !== "vencida" && b.estado === "vencida") return 1;
      
      // Luego por fecha de fin (más próximas primero)
      const fechaFinA = new Date(a.fechaFin);
      const fechaFinB = new Date(b.fechaFin);
      return fechaFinA.getTime() - fechaFinB.getTime();
    })
    .slice(0, maxItems);
  }, [actividadesFiltradas, itrbItems, proyectos]);
  
  // Función para obtener el color según el estado
  const getColorByEstado = (estado: string): string => {
    switch (estado) {
      case "completada": return "bg-green-500";
      case "en-curso": return "bg-blue-500";
      case "vencida": return "bg-red-500";
      case "pendiente": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };
  
  // Función para obtener el badge según el estado
  const getBadgeByEstado = (estado: string) => {
    switch (estado) {
      case "completada":
        return <Badge className="bg-green-500">Completada</Badge>;
      case "en-curso":
        return <Badge className="bg-blue-500">En curso</Badge>;
      case "vencida":
        return <Badge className="bg-red-500">Vencida</Badge>;
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };
  
  // Si no hay actividades que mostrar
  if (actividadesConInfo.length === 0) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Actividades recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No se encontraron actividades</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajuste los filtros o cree nuevas actividades
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Actividades recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {actividadesConInfo.map((actividad) => (
              <div key={actividad.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getColorByEstado(actividad.estado)}`}></div>
                    <h3 className="font-medium truncate max-w-[250px]">{actividad.nombre}</h3>
                  </div>
                  {getBadgeByEstado(actividad.estado)}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]" title={actividad.proyectoNombre}>
                      {actividad.proyectoNombre}
                    </span>
                    <ArrowRight className="h-3 w-3 mx-1" />
                    <span>{actividad.sistema}</span>
                    <ArrowRight className="h-3 w-3 mx-1" />
                    <span className="truncate max-w-[100px]" title={actividad.subsistema}>{actividad.subsistema}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(actividad.fechaInicio).toLocaleDateString()} - {new Date(actividad.fechaFin).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span>{actividad.completados}/{actividad.totalITRBs}</span>
                      {actividad.vencidos > 0 && (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 ml-2 text-red-500" />
                          <span className="text-red-500">{actividad.vencidos}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <Progress 
                      value={actividad.progreso} 
                      className="h-2" 
                      // Fix: Remove indicatorClassName and style the indicator directly using the class prop
                      // with conditional styling based on the state
                      className={`h-2 ${
                        actividad.progreso === 100 
                          ? "bg-green-500" 
                          : actividad.estado === "vencida"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>{Math.round(actividad.progreso)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActividadesWidget;
