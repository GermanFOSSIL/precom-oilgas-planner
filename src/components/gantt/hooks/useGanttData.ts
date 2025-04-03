
import { useMemo } from "react";
import { Actividad, ITRB, Proyecto, FiltrosDashboard } from "@/types";
import { getColorByProgress } from "../utils/colorUtils";

interface GanttItem {
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
  itrbsAsociados: ITRB[];
}

/**
 * Custom hook to process and filter data for Gantt charts
 */
export const useGanttData = (
  actividades: Actividad[],
  itrbItems: ITRB[],
  proyectos: Proyecto[],
  filtros: FiltrosDashboard
) => {
  // Filter activities based on applied filters
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(actividad => {
      if (filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
        return false;
      }
      
      if (filtros.sistema && filtros.sistema !== "todos" && actividad.sistema !== filtros.sistema) {
        return false;
      }
      
      if (filtros.subsistema && filtros.subsistema !== "todos" && actividad.subsistema !== filtros.subsistema) {
        return false;
      }
      
      if (filtros.busquedaActividad) {
        const busquedaMinuscula = filtros.busquedaActividad.toLowerCase();
        
        if (actividad.nombre.toLowerCase().includes(busquedaMinuscula)) {
          return true;
        }
        
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => 
          itrb.descripcion.toLowerCase().includes(busquedaMinuscula)
        );
      }
      
      if (filtros.estadoITRB && filtros.estadoITRB !== "todos") {
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => itrb.estado === filtros.estadoITRB);
      }
      
      if (filtros.tareaVencida) {
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => itrb.estado === "Vencido");
      }
      
      if (filtros.mcc) {
        const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
        return itrbsAsociados.some(itrb => itrb.mcc);
      }
      
      return true;
    });
  }, [actividades, itrbItems, filtros]);

  // Transform filtered activities into Gantt chart data format
  const ganttData = useMemo(() => {
    return actividadesFiltradas.map(actividad => {
      const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
      const itrbsAsociados = itrbItems.filter(itrb => itrb.actividadId === actividad.id);
      
      const totalItrb = itrbsAsociados.length;
      const completados = itrbsAsociados.filter(itrb => itrb.estado === "Completado").length;
      const progreso = totalItrb > 0 ? (completados / totalItrb) * 100 : 0;
      
      const tieneVencidos = itrbsAsociados.some(itrb => itrb.estado === "Vencido");
      const tieneMCC = itrbsAsociados.some(itrb => itrb.mcc);
      
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
        tieneMCC,
        proyecto: proyecto?.titulo || "Sin proyecto",
        color: getColorByProgress(progreso, tieneVencidos),
        itrbsAsociados
      };
    });
  }, [actividadesFiltradas, proyectos, itrbItems]);

  return { ganttData };
};
