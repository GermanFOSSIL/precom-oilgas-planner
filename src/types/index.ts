
// Definición de tipos de datos para la aplicación

export type UserRole = "admin" | "viewer";

export interface User {
  email: string;
  role: UserRole;
}

export interface Actividad {
  id: string;
  nombre: string;
  sistema: string;
  subsistema: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
}

export type EstadoITRB = "En curso" | "Completado" | "Vencido";

export interface ITRB {
  id: string;
  actividadId: string;
  descripcion: string;
  cantidadTotal: number;
  cantidadRealizada: number;
  fechaLimite: string;
  estado: EstadoITRB;
  ccc: boolean;
}

export interface KPIs {
  avanceFisico: number;
  totalITRB: number;
  realizadosITRB: number;
  subsistemasCCC: number;
  actividadesVencidas: number;
}
