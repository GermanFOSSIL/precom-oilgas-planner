
/**
 * Compatibility type definitions for transitioning from ITRB to ITR
 */

// Legacy ITRB type for backward compatibility
export interface ITRB {
  id: string;
  actividadId: string;
  descripcion: string;
  cantidadTotal: number;
  cantidadRealizada: number;
  estado: EstadoITRB;
  fechaLimite: string;
  mcc: boolean;
  observaciones?: string;
}

// Legacy EstadoITRB
export type EstadoITRB = "En curso" | "Completado" | "Pendiente" | "Vencido";

// Legacy Proyecto type
export interface LegacyProyecto {
  id: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Add compatibility functions to global window object for component usage
declare global {
  interface Window {
    getActividadProyectoId?: (actividadId: string) => string | undefined;
  }
}
