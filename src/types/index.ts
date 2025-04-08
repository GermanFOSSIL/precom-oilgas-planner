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
  codigo: string; // Campo obligatorio para el código del ITR B
  cantidadTotal: number;
  cantidadRealizada: number;
  fechaInicio: string;
  fechaLimite: string;
  estado: EstadoITRB;
  mcc: boolean; 
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
  itrFilter?: string;
  fechaInicioFilter?: string;
  fechaFinFilter?: string;
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
  estado?: EstadoITRB[];
}

export interface ItemRelacionado {
  id: string;
  tipo: "actividad" | "itrb" | "proyecto";
  nombre: string;
}

export interface GraficoPersonalizado {
  id: string;
  titulo: string;
  tipo: "barras" | "lineas" | "pastel" | "area";
  datos: "avance" | "itrb" | "actividades" | "vencimientos";
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
