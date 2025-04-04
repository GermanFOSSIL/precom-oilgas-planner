
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
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Actividad {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  sistema: string;
  subsistema: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  dependencias?: string[];
}

export type EstadoITR = "En curso" | "Completado" | "Pendiente" | "Vencido";

export interface ITR {
  id: string;
  proyectoId: string;
  actividadId?: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadTotal: number;
  cantidadRealizada: number;
  estado: EstadoITR;
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
  timestamp?: string;
}

export interface ConfiguracionGrafico {
  tamano: "pequeno" | "mediano" | "grande" | "completo";
  mostrarLeyenda: boolean;
  mostrarSubsistemas: boolean;
}

export interface AppTheme {
  mode: "light" | "dark";
}

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

export interface CriticalPathConfig {
  vistaAgrupada: "proyecto" | "sistema" | "subsistema";
  mostrarCompletados: boolean;
  ordernarPor: "retraso" | "impacto" | "fechaVencimiento";
}

export interface FiltrosAvanzados {
  fechaInicioRango?: string;
  fechaFinRango?: string;
  prioridad?: "alta" | "media" | "baja" | "todas";
  responsable?: string;
  estado?: EstadoITR[];
}

export interface ItemRelacionado {
  id: string;
  tipo: "actividad" | "itr" | "proyecto";
  nombre: string;
}

export interface GraficoPersonalizado {
  id: string;
  titulo: string;
  tipo: "barras" | "lineas" | "pastel" | "area";
  datos: "avance" | "itr" | "actividades" | "vencimientos";
  filtro?: Partial<FiltrosDashboard>;
  color: string;
  posicion: number;
}

export interface OpcionesReporte {
  incluirGantt: boolean;
  formatoGantt: "imagen" | "tabla";
  orientacion: "vertical" | "horizontal";
  incluirKPIs: boolean;
  incluirActividades: boolean;
  incluirITRB: boolean;
}

export interface BackupOptions {
  includeProyectos: boolean;
  includeActividades: boolean;
  includeITRB: boolean;
  includeAlertas: boolean;
  includeKpiConfig: boolean;
  proyectoSeleccionado?: string;
}

export interface LoginProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

export interface PublicHeaderProps {
  onLoginClick?: () => void;
}

export interface APIKeys {
  openAI?: string;
  aiModel?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Interfaces para los formularios de creación/edición
export interface ProyectoFormData {
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export interface ActividadFormData {
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  sistema: string;
  subsistema: string;
  fechaInicio: Date;
  fechaFin: Date;
  dependencias?: string[];
}

export interface ITRFormData {
  proyectoId: string;
  actividadId?: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  cantidadTotal: number;
  cantidadRealizada: number;
  estado: EstadoITR;
  mcc: boolean;
  observaciones?: string;
  codigoITR?: string;
}
