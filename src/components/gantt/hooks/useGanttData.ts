
import { useMemo } from "react";
import { FiltrosDashboard } from "@/types";
import { getColorByProgress } from "../utils/colorUtils";

export const useGanttData = (
  actividades: any[],
  itrbItems: any[],
  proyectos: any[],
  filtros: FiltrosDashboard
) => {
  const ganttData = useMemo(() => {
    // Filtrar actividades según los filtros seleccionados
    return actividades
      .filter(actividad => {
        // Filtrar por proyecto si está definido
        if (filtros.proyecto && filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
          return false;
        }
        
        // Filtrar por sistema si está definido
        if (filtros.sistema && actividad.sistema !== filtros.sistema) {
          return false;
        }
        
        // Filtrar por subsistema si está definido
        if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
          return false;
        }
        
        return true;
      })
      .map(actividad => {
        // Buscar el proyecto relacionado
        const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
        
        // Obtener los ITRBs asociados a esta actividad
        const itrbsAsociados = itrbItems.filter(i => i.actividadId === actividad.id);
        
        // Calcular el progreso basado en los ITRBs completados
        const itrbsCompletados = itrbsAsociados.filter(i => i.estado === "Completado").length;
        const totalItrbs = itrbsAsociados.length;
        const progreso = totalItrbs > 0 ? Math.round((itrbsCompletados / totalItrbs) * 100) : 0;
        
        // Verificar si hay ITRBs vencidos
        const hoy = new Date();
        const tieneVencidos = itrbsAsociados.some(
          i => i.estado !== "Completado" && new Date(i.fechaVencimiento) < hoy
        );
        
        // Verificar si tiene MCC (Manufacturing Completion Certificate)
        const tieneMCC = actividad.tieneMCC || false;
        
        // Determinar el color basado en el progreso y si tiene vencidos
        const color = getColorByProgress(progreso, tieneVencidos);
        
        // Formatear fechas como objetos Date y asegurar que sean válidas
        const fechaInicio = new Date(actividad.fechaInicio);
        const fechaFin = new Date(actividad.fechaFin);
        
        // Si alguna fecha es inválida, usar fechas por defecto
        const validFechaInicio = !isNaN(fechaInicio.getTime()) ? fechaInicio : new Date();
        const validFechaFin = !isNaN(fechaFin.getTime()) ? fechaFin : new Date(new Date().setDate(new Date().getDate() + 7));
        
        // Calcular la duración en días (si no está definida)
        const duracion = actividad.duracion || 
          Math.ceil((validFechaFin.getTime() - validFechaInicio.getTime()) / (1000 * 60 * 60 * 24));
        
        // Asegurarse de que los ITRBs asociados tengan fechas válidas
        const itrbsProcesados = itrbsAsociados.map(itrb => {
          const itrbFechaInicio = new Date(itrb.fechaInicio || validFechaInicio);
          const itrbFechaVencimiento = new Date(itrb.fechaVencimiento || itrb.fechaLimite || validFechaFin);
          
          return {
            ...itrb,
            fechaInicio: !isNaN(itrbFechaInicio.getTime()) ? itrbFechaInicio : validFechaInicio,
            fechaVencimiento: !isNaN(itrbFechaVencimiento.getTime()) ? itrbFechaVencimiento : validFechaFin
          };
        });
        
        return {
          id: actividad.id,
          nombre: actividad.nombre,
          sistema: actividad.sistema,
          subsistema: actividad.subsistema,
          fechaInicio: validFechaInicio,
          fechaFin: validFechaFin,
          duracion,
          progreso,
          tieneVencidos,
          tieneMCC,
          proyecto: proyecto?.titulo || "Sin proyecto",
          color,
          itrbsAsociados: itrbsProcesados
        };
      })
      // Ordenar por sistema, subsistema y nombre
      .sort((a, b) => {
        const sistemasCompare = a.sistema.localeCompare(b.sistema);
        if (sistemasCompare !== 0) return sistemasCompare;
        
        const subsistemCompare = a.subsistema.localeCompare(b.subsistema);
        if (subsistemCompare !== 0) return subsistemCompare;
        
        return a.nombre.localeCompare(b.nombre);
      });
      
    return ganttData;
  }, [actividades, itrbItems, proyectos, filtros]);

  return { ganttData };
};
