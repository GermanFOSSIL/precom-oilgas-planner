export type UserRole = "admin" | "tecnico" | "viewer";

export interface User {
  email: string;
  role: UserRole;
  nombre?: string;
}

export interface Proyecto {
  id: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Actividad {
  id: string;
  proyectoId: string;
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
  observaciones?: string;
}

export interface Alerta {
  id: string;
  tipo: "Vencimiento" | "Alerta" | "Información";
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
  itemsRelacionados?: string[];
  proyectoId?: string;
}

export interface KPIs {
  avanceFisico: number;
  totalITRB: number;
  realizadosITRB: number;
  subsistemasCCC: number;
  totalSubsistemas: number;
  actividadesVencidas: number;
  proyectoId?: string;
}

export interface FiltrosDashboard {
  proyecto: string | "todos";
}

export interface ConfiguracionGrafico {
  tamano: "pequeno" | "mediano" | "grande";
  mostrarLeyenda: boolean;
}

export interface AppTheme {
  mode: "light" | "dark";
}

// Nueva interfaz para la configuración de KPIs
export interface KPIConfig {
  itrVencidosMostrar: "total" | "diferencia" | "pendientes" | "completados";
}
