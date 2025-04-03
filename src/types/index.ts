
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
  mcc: boolean; 
  observaciones?: string;
  codigoITR?: string;
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
  subsistemasMCC: number;
  totalSubsistemas: number;
  actividadesVencidas: number;
  proyectoId?: string;
}

export interface FiltrosDashboard {
  proyecto: string | "todos";
  sistema?: string;
  subsistema?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busquedaActividad?: string;
  estadoITRB?: "Completado" | "En curso" | "Vencido" | "todos";
  mcc?: boolean;
  tareaVencida?: boolean;
  timestamp?: number; 
}

export interface ConfiguracionGrafico {
  tamano: "pequeno" | "mediano" | "grande" | "completo";
  mostrarLeyenda: boolean;
  mostrarSubsistemas: boolean; // Changed from optional to required
}

export interface AppTheme {
  mode: "light" | "dark";
}

// Configuración de KPIs ampliada
export interface KPIConfig {
  itrVencidosMostrar: "total" | "diferencia" | "pendientes" | "completados";
  nombreKPI1?: string;
  nombreKPI2?: string;
  nombreKPI3?: string;
  nombreKPI4?: string;
  kpiPersonalizado1?: "avanceFisico" | "totalITRB" | "realizadosITRB" | "actividadesVencidas" | "subsistemasMCC";
  kpiPersonalizado2?: "avanceFisico" | "totalITRB" | "realizadosITRB" | "actividadesVencidas" | "subsistemasMCC";
  kpiPersonalizado3?: "avanceFisico" | "totalITRB" | "realizadosITRB" | "actividadesVencidas" | "subsistemasMCC";
  kpiPersonalizado4?: "avanceFisico" | "totalITRB" | "realizadosITRB" | "actividadesVencidas" | "subsistemasMCC";
}

// Nueva configuración para Ruta Crítica
export interface CriticalPathConfig {
  vistaAgrupada: "proyecto" | "sistema" | "subsistema";
  mostrarCompletados: boolean;
  ordernarPor: "retraso" | "impacto" | "fechaVencimiento";
}

// Nueva interfaz para filtros avanzados
export interface FiltrosAvanzados {
  fechaInicioRango?: string;
  fechaFinRango?: string;
  prioridad?: "alta" | "media" | "baja" | "todas";
  responsable?: string;
  estado?: EstadoITRB[];
}

// Para mejorar la asignación de ITRBs a Actividades
export interface ItemRelacionado {
  id: string;
  tipo: "actividad" | "itrb" | "proyecto";
  nombre: string;
}

// Nueva interfaz para configurar gráficos dinámicos
export interface GraficoPersonalizado {
  id: string;
  titulo: string;
  tipo: "barras" | "lineas" | "pastel" | "area";
  datos: "avance" | "itrb" | "actividades" | "vencimientos";
  filtro?: Partial<FiltrosDashboard>;
  color: string;
  posicion: number;
}

// Interface for exported report options
export interface OpcionesReporte {
  incluirGantt: boolean;
  formatoGantt: "imagen" | "tabla";
  orientacion: "vertical" | "horizontal";
  incluirKPIs: boolean;
  incluirActividades: boolean;
  incluirITRB: boolean;
}

// Updated BackupOptions interface with correct property names
export interface BackupOptions {
  includeProyectos: boolean;
  includeActividades: boolean;
  includeITRB: boolean;
  includeAlertas: boolean;
  includeKpiConfig?: boolean;
  proyectoSeleccionado?: string;
}
