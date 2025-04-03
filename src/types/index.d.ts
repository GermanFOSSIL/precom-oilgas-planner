
// These should not be modified if already exist
// Just making sure they are correctly defined in the project

export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  rol: "admin" | "tecnico" | "viewer";
  passwordHash: string;
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

export interface ITRB {
  id: string;
  actividadId: string;
  descripcion: string;
  cantidadTotal: number;
  cantidadRealizada: number;
  estado: "Completado" | "En curso" | "Vencido";
  fechaLimite: string;
  ccc: boolean;
  mcc: boolean;
  observaciones?: string;
}

export interface AppTheme {
  mode: "light" | "dark";
  primaryColor: string;
}

export interface FiltrosDashboard {
  proyecto: string;
  sistema?: string;
  subsistema?: string;
  fechaInicio?: string;
  fechaFin?: string;
  busquedaActividad?: string;
  estadoITRB?: "Completado" | "En curso" | "Vencido" | "todos";
  ccc?: boolean;
  tareaVencida?: boolean;
  timestamp?: number; // Adding timestamp for cache refreshing
}

export interface ConfiguracionGrafico {
  tamano: "pequeno" | "mediano" | "grande" | "completo";
  mostrarLeyenda: boolean;
}

export interface AppContextType {
  user: Usuario | null;
  isAdmin: boolean;
  isTecnico: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  theme: AppTheme;
  toggleTheme: () => void;
  filtros: FiltrosDashboard;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosDashboard>>;
  proyectos: Proyecto[];
  addProyecto: (proyecto: Proyecto) => void;
  updateProyecto: (id: string, proyecto: Proyecto) => void;
  deleteProyecto: (id: string) => void;
  setProyectos: (proyectos: Proyecto[]) => void;
  actividades: Actividad[];
  addActividad: (actividad: Actividad) => void;
  updateActividad: (id: string, actividad: Actividad) => void;
  deleteActividad: (id: string) => void;
  setActividades: (actividades: Actividad[]) => void;
  itrbItems: ITRB[];
  addITRB: (itrb: ITRB) => void;
  updateITRB: (id: string, itrb: ITRB) => void;
  deleteITRB: (id: string) => void;
  setItrbItems: (itrbItems: ITRB[]) => void;
  proyectoActual: string;
  setProyectoActual: (id: string) => void;
  alertas: any[];
  setAlertas: (alertas: any[]) => void;
  kpiConfig: any;
  updateKPIConfig: (config: any) => void;
}

// Interface for backup options
export interface BackupOptions {
  proyectos?: boolean;
  actividades?: boolean;
  itrbItems?: boolean;
  alertas?: boolean;
  kpiConfig?: boolean;
}

// Interfaces for the new UserPermission components
export interface UserPermission {
  dashboard: boolean;
  actividades: boolean;
  itrb: boolean;
  proyectos: boolean;
  reportes: boolean;
  configuracion: boolean;
}

export interface AppUser {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: "admin" | "tecnico" | "viewer";
  permisos: UserPermission;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

// Interface for PDF report configuration
export interface ReportConfig {
  titulo: string;
  incluirLogo: boolean;
  incluirFecha: boolean;
  incluirProyectoInfo: boolean;
  colorPrimario: string;
  incluirActividades: boolean;
  incluirITRB: boolean;
  incluirEstadisticas: boolean;
  orientacion: "portrait" | "landscape";
  tamano: "a4" | "letter" | "legal";
  comentarios: string;
}
