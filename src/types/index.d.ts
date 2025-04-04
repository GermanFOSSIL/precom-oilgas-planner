
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
  fechaInicio: string;
  estado: "En curso" | "Completado" | "Pendiente" | "Vencido";
  fechaLimite: string;
  mcc: boolean;
  observaciones?: string;
}

export interface FiltrosDashboard {
  proyecto: string;
  sistema?: string;
  subsistema?: string;
  estadoITRB?: string;
  tareaVencida?: boolean;
  busquedaActividad?: string;
  timestamp: string;
  fechaInicioFilter?: string;
  fechaFinFilter?: string;
  itrFilter?: string;
}

export interface ConfiguracionGrafico {
  tamano?: "pequeno" | "mediano" | "grande" | "completo";
  mostrarLeyenda?: boolean;
  mostrarSubsistemas?: boolean;
}

export interface KPIConfig {
  nombreKPI1?: string;
  nombreKPI2?: string;
  nombreKPI3?: string;
  nombreKPI4?: string;
  kpiPersonalizado1?: string;
  kpiPersonalizado2?: string;
  kpiPersonalizado3?: string;
  kpiPersonalizado4?: string;
  itrVencidosMostrar?: "total" | "diferencia" | "pendientes" | "completados";
}

export interface APIKeys {
  openAI?: string;
  aiModel?: string;
}

export interface AppContextType {
  user: any;
  setUser: (user: any) => void;
  logout: () => void;
  isAdmin: boolean;
  isTecnico: boolean;
  theme: {
    mode: "light" | "dark";
  };
  toggleTheme: () => void;
  proyectos: Proyecto[];
  actividades: Actividad[];
  itrbItems: ITRB[];
  filtros: FiltrosDashboard;
  setFiltros: (filtros: FiltrosDashboard) => void;
  configuracionGrafico: ConfiguracionGrafico;
  setConfigurationGrafico: (configuracion: ConfiguracionGrafico) => void;
  proyectoActual: string;
  setProyectoActual: (proyectoId: string) => void;
  addProyecto: (proyecto: Proyecto) => void;
  updateProyecto: (id: string, updates: Partial<Proyecto>) => void;
  deleteProyecto: (id: string) => void;
  addActividad: (actividad: Actividad) => void;
  updateActividad: (id: string, updates: Partial<Actividad>) => void;
  deleteActividad: (id: string) => void;
  addITRB: (itrb: ITRB) => void;
  updateITRB: (id: string, updates: Partial<ITRB>) => void;
  deleteITRB: (id: string) => void;
  kpiConfig: KPIConfig;
  updateKPIConfig: (config: Partial<KPIConfig>) => void;
  apiKeys: APIKeys;
  updateAPIKeys: (keys: Partial<APIKeys>) => void;
  getKPIs: (proyectoId?: string) => KPIs;
}

export interface KPIs {
  avanceFisico: number;
  totalITRB: number;
  realizadosITRB: number;
  subsistemasMCC: number;
  actividadesVencidas: number;
  totalSubsistemas: number;
  proyectoId?: string;
}

export interface User {
  email: string;
  role: "admin" | "tecnico" | "viewer";
  nombre: string;
}

export interface AppTheme {
  mode: "light" | "dark";
}

export interface Alerta {
  id: string;
  tipo: "Vencimiento" | "Recordatorio" | "Sistema";
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
  itemsRelacionados?: string[];
  proyectoId?: string;
}

export type EstadoITRB = "En curso" | "Completado" | "Pendiente" | "Vencido";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
