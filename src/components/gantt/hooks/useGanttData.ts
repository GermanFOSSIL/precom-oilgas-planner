
import { useState, useEffect } from "react";
import { Actividad, ITRB, Proyecto, FiltrosDashboard } from "@/types";

interface ExtendedFiltrosDashboard extends FiltrosDashboard {
  itrFilter?: string;
  fechaInicioFilter?: string;
  fechaFinFilter?: string;
}

export const useGanttData = (
  actividades: Actividad[],
  itrbItems: ITRB[],
  proyectos: Proyecto[],
  filtros: ExtendedFiltrosDashboard
) => {
  const [ganttData, setGanttData] = useState<any[]>([]);

  useEffect(() => {
    // Aquí procesamos y filtramos los datos para el gráfico de Gantt
    const filteredActividadesMap = new Map();
    const filteredItrbs = new Map();

    // Filtramos las actividades según los criterios
    actividades.forEach((actividad) => {
      if (
        (filtros.proyecto === "todos" || actividad.proyectoId === filtros.proyecto) &&
        (!filtros.sistema || actividad.sistema === filtros.sistema) &&
        (!filtros.subsistema || actividad.subsistema === filtros.subsistema) &&
        (!filtros.busquedaActividad || 
          actividad.nombre.toLowerCase().includes(filtros.busquedaActividad.toLowerCase()))
      ) {
        filteredActividadesMap.set(actividad.id, actividad);
      }
    });

    // Filtramos los ITRs según los criterios específicos de ITR
    itrbItems.forEach((itrb) => {
      // Sólo incluimos ITRBs cuya actividad pasó el filtro anterior
      if (filteredActividadesMap.has(itrb.actividadId)) {
        // Aplicamos filtros adicionales específicos para ITRBs
        const descripcionCoincide = !filtros.itrFilter || 
          itrb.descripcion.toLowerCase().includes(filtros.itrFilter.toLowerCase());
        
        const estadoCoincide = !filtros.estadoITRB || itrb.estado === filtros.estadoITRB;

        // Filtrado por fechas
        let fechasCoinciden = true;
        
        if (filtros.fechaInicioFilter) {
          const fechaInicioFiltro = new Date(filtros.fechaInicioFilter);
          const fechaInicioItrb = new Date(itrb.fechaInicio || "");
          fechasCoinciden = fechasCoinciden && !isNaN(fechaInicioFiltro.getTime()) && 
            !isNaN(fechaInicioItrb.getTime()) && fechaInicioItrb >= fechaInicioFiltro;
        }
        
        if (filtros.fechaFinFilter && fechasCoinciden) {
          const fechaFinFiltro = new Date(filtros.fechaFinFilter);
          const fechaFinItrb = new Date(itrb.fechaLimite || "");
          fechasCoinciden = fechasCoinciden && !isNaN(fechaFinFiltro.getTime()) && 
            !isNaN(fechaFinItrb.getTime()) && fechaFinItrb <= fechaFinFiltro;
        }

        // Si todos los filtros coinciden, incluimos el ITRB
        if (descripcionCoincide && estadoCoincide && fechasCoinciden) {
          filteredItrbs.set(itrb.id, itrb);
        }
      }
    });

    // Determinar si debemos filtrar por ITRs
    const filtrarPorItrs = filtros.itrFilter || filtros.estadoITRB || 
                          filtros.fechaInicioFilter || filtros.fechaFinFilter;

    // Construimos la estructura jerárquica para el gráfico de Gantt
    const proyectosData: any[] = proyectos
      .filter((proyecto) => filtros.proyecto === "todos" || proyecto.id === filtros.proyecto)
      .map((proyecto) => {
        const proyectoActividades = Array.from(filteredActividadesMap.values())
          .filter((act) => act.proyectoId === proyecto.id);

        // Agrupar por sistema
        const sistemaMap = new Map();
        proyectoActividades.forEach((act) => {
          if (!sistemaMap.has(act.sistema)) {
            sistemaMap.set(act.sistema, []);
          }
          sistemaMap.get(act.sistema).push(act);
        });

        // Construir los sistemas
        const sistemas = Array.from(sistemaMap.entries()).map(([nombreSistema, sistemaActividades]) => {
          // Agrupar por subsistema
          const subsistemaMap = new Map();
          (sistemaActividades as Actividad[]).forEach((act) => {
            if (!subsistemaMap.has(act.subsistema)) {
              subsistemaMap.set(act.subsistema, []);
            }
            subsistemaMap.get(act.subsistema).push(act);
          });

          // Construir subsistemas
          const subsistemas = Array.from(subsistemaMap.entries())
            .map(([nombreSubsistema, subsistemaActividades]) => {
              const actividadesArray = (subsistemaActividades as Actividad[]).map((act) => {
                // Filtrar ITRBs para esta actividad
                const actItrbs = Array.from(filteredItrbs.values())
                  .filter((itrb: ITRB) => itrb.actividadId === act.id);
                
                // Si estamos filtrando por ITRs y esta actividad no tiene ITRs que coincidan,
                // no la incluimos, a menos que no haya filtros de ITR
                if (filtrarPorItrs && actItrbs.length === 0) {
                  return null;
                }
                
                return {
                  ...act,
                  id: act.id,
                  nombre: act.nombre,
                  fechaInicio: act.fechaInicio,
                  fechaFin: act.fechaFin || act.fechaInicio
                };
              }).filter(Boolean); // Eliminar los nulls

              if (actividadesArray.length === 0) {
                return null;
              }

              return {
                nombre: nombreSubsistema,
                actividades: actividadesArray,
                itrbs: Array.from(filteredItrbs.values())
                  .filter((itrb: ITRB) => {
                    const actividad = filteredActividadesMap.get(itrb.actividadId);
                    return actividad && actividad.sistema === nombreSistema && 
                           actividad.subsistema === nombreSubsistema;
                  })
              };
            }).filter(Boolean); // Eliminar los nulls

          // Si no hay subsistemas después de filtrar, no incluimos el sistema
          if (subsistemas.length === 0) {
            return null;
          }

          return {
            nombre: nombreSistema,
            subsistemas: subsistemas,
            actividades: []
          };
        }).filter(Boolean); // Eliminar los nulls

        return {
          id: proyecto.id,
          nombre: proyecto.titulo,
          sistemas: sistemas
        };
      }).filter((p) => p.sistemas.length > 0); // Solo incluir proyectos con sistemas

    setGanttData(proyectosData);
  }, [actividades, itrbItems, proyectos, filtros]);

  return { ganttData };
};
