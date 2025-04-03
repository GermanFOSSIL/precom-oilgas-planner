
// Add this to your types file
export interface BackupOptions {
  includeProyectos: boolean;
  includeActividades: boolean;
  includeITRB: boolean;
  includeAlertas: boolean;
  proyectoSeleccionado?: string;
  kpiConfig?: boolean;
}

// Make sure your ConfiguracionGrafico type includes mostrarSubsistemas
export interface ConfiguracionGrafico {
  tamano: "pequeno" | "mediano" | "grande" | "completo";
  mostrarLeyenda: boolean;
  mostrarSubsistemas?: boolean;
}

// Update ITRB to include mcc field instead of ccc
export interface ITRB {
  id: string;
  actividadId: string;
  codigoITR?: string;
  descripcion: string;
  fechaLimite: string;
  cantidadTotal: number;
  cantidadRealizada: number;
  estado: EstadoITRB;
  mcc: boolean; // This should be mcc instead of ccc
}

// Update FiltrosDashboard to include mcc field
export interface FiltrosDashboard {
  proyecto: string | "todos";
  sistema?: string;
  subsistema?: string;
  estadoITRB?: EstadoITRB | "todos";
  tareaVencida?: boolean;
  busquedaActividad?: string;
  timestamp?: number;
  mcc?: boolean; // This should be mcc instead of ccc
}

// Add GraficoPersonalizado interface to ensure color is required
export interface GraficoPersonalizado {
  id: string;
  titulo: string;
  tipo: "barras" | "lineas" | "area" | "pastel";
  datos: "actividades" | "itrb" | "avance" | "vencimientos";
  filtro?: Partial<FiltrosDashboard>;
  color: string;
  posicion: number;
}

// Add OpcionesReporte interface for ReportGenerator
export interface OpcionesReporte {
  incluirGantt: boolean;
  formatoGantt: string;
  orientacion: string;
  incluirKPIs: boolean;
  incluirActividades: boolean;
  incluirITRB: boolean;
}
