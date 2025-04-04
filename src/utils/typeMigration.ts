
import { ITR, Proyecto } from '@/types';
import { ITRB } from '@/types/compatibility';

/**
 * Utility functions to handle migration from old ITRB to new ITR format
 */

// Convert old ITRB properties to new ITR format
export const convertToITR = (oldITRB: ITRB): ITR => {
  return {
    id: oldITRB.id,
    proyectoId: oldITRB.actividadId ? 
      // Try to get proyectoId from the parent actividad if available
      (window as any).getActividadProyectoId?.(oldITRB.actividadId) || "default-project" : 
      "default-project",
    actividadId: oldITRB.actividadId,
    nombre: oldITRB.descripcion?.substring(0, 50) || "ITR sin nombre",
    descripcion: oldITRB.descripcion || "",
    // Use fechaLimite as fechaFin if available, or current date + 30 days
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: oldITRB.fechaLimite || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cantidadTotal: oldITRB.cantidadTotal || 1,
    cantidadRealizada: oldITRB.cantidadRealizada || 0,
    estado: oldITRB.estado || "En curso",
    mcc: !!oldITRB.mcc,
    observaciones: oldITRB.observaciones || "",
    codigoITR: oldITRB.codigoITR || ""
  };
};

// Convert old Proyecto format to include the new required fields
export const convertToProyecto = (oldProyecto: any): Proyecto => {
  return {
    id: oldProyecto.id,
    titulo: oldProyecto.titulo,
    descripcion: oldProyecto.descripcion || "",
    fechaInicio: oldProyecto.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: oldProyecto.fechaFin || 
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaCreacion: oldProyecto.fechaCreacion || new Date().toISOString(),
    fechaActualizacion: oldProyecto.fechaActualizacion || new Date().toISOString()
  };
};

// Helper to extract fechaFin from ITR object or fallback to a date
export const getITRFechaFin = (itr: ITR): Date => {
  return new Date(itr.fechaFin);
};
