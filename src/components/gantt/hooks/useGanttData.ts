
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
        if (filtros.sistema && filtros.sistema !== "todos" && actividad.sistema !== filtros.sistema) {
          return false;
        }
        
        // Filtrar por subsistema si está definido
        if (filtros.subsistema && filtros.subsistema !== "todos" && actividad.subsistema !== filtros.subsistema) {
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
        const tieneVencidos = itrbsAsociados.some(i => {
          if (i.estado !== "Completado") {
            try {
              const fechaLimite = new Date(i.fechaLimite);
              return !isNaN(fechaLimite.getTime()) && fechaLimite < hoy;
            } catch (e) {
              return false;
            }
          }
          return false;
        });
        
        // Verificar si tiene MCC (Manufacturing Completion Certificate)
        const tieneMCC = actividad.tieneMCC || false;
        
        // Determinar el color basado en el progreso y si tiene vencidos
        const color = getColorByProgress(progreso, tieneVencidos);
        
        // Formatear fechas como objetos Date y asegurar que sean válidas
        let fechaInicio, fechaFin;
        
        try {
          fechaInicio = new Date(actividad.fechaInicio);
          if (isNaN(fechaInicio.getTime())) {
            fechaInicio = new Date();
          }
        } catch (e) {
          fechaInicio = new Date();
        }
        
        try {
          fechaFin = new Date(actividad.fechaFin);
          if (isNaN(fechaFin.getTime())) {
            fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + 7);
          }
        } catch (e) {
          fechaFin = new Date();
          fechaFin.setDate(fechaFin.getDate() + 7);
        }
        
        // Calcular la duración en días (si no está definida)
        const duracion = actividad.duracion || 
          Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
        
        // Asegurarse de que los ITRBs asociados tengan fechas válidas
        const itrbsProcesados = itrbsAsociados.map(itrb => {
          // Procesar fechas de ITRB
          let itrbFechaInicio, itrbFechaLimite;
          
          try {
            // Usar fecha inicio del ITRB si existe, si no, usar la de la actividad
            itrbFechaInicio = itrb.fechaInicio 
              ? new Date(itrb.fechaInicio) 
              : fechaInicio;
              
            if (isNaN(itrbFechaInicio.getTime())) {
              itrbFechaInicio = fechaInicio;
            }
          } catch (e) {
            itrbFechaInicio = fechaInicio;
          }
          
          try {
            itrbFechaLimite = new Date(itrb.fechaLimite);
            if (isNaN(itrbFechaLimite.getTime())) {
              itrbFechaLimite = new Date(fechaInicio);
              itrbFechaLimite.setDate(itrbFechaLimite.getDate() + 7);
            }
          } catch (e) {
            itrbFechaLimite = new Date(fechaInicio);
            itrbFechaLimite.setDate(itrbFechaLimite.getDate() + 7);
          }
          
          return {
            ...itrb,
            fechaInicio: itrbFechaInicio,
            fechaLimite: itrbFechaLimite
          };
        });
        
        return {
          id: actividad.id,
          nombre: actividad.nombre,
          sistema: actividad.sistema,
          subsistema: actividad.subsistema,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
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
