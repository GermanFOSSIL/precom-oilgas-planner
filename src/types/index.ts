
// Definición de tipos de datos para la aplicación

export type UserRole = "admin" | "tecnico" | "viewer";

export interface User {
  email: string;
  role: UserRole;
  nombre?: string;
  proyectosAsignados?: string[]; // IDs de proyectos asignados al usuario
}

export interface Proyecto {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  responsable?: string; // email del responsable
}

export interface Actividad {
  id: string;
  proyectoId: string; // Relación con el proyecto
  nombre: string;
  sistema: string;
  subsistema: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  observaciones?: string;
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
  observaciones?: string;
}

export interface Alerta {
  id: string;
  tipo: "Vencimiento" | "CCC Pendiente" | "Falta Ejecución";
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
  itemsRelacionados?: string[]; // IDs de ITRBs relacionados
  proyectoId: string;
}

export interface KPIs {
  avanceFisico: number;
  totalITRB: number;
  realizadosITRB: number;
  subsistemasCCC: number;
  actividadesVencidas: number;
  // Nuevos KPIs
  totalSubsistemas: number;
  proyectoId?: string;
}

export interface AppTheme {
  mode: "light" | "dark";
}

export interface FiltrosDashboard {
  proyecto: string | "todos";
  sistema?: string;
  subsistema?: string;
  estadoITRB?: EstadoITRB;
  ccc?: boolean;
  tareaVencida?: boolean;
  busquedaActividad?: string;
}

export interface ConfiguracionGrafico {
  tamano: "pequeno" | "mediano" | "grande" | "completo";
  mostrarLeyenda: boolean;
}
