
import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from "react";
import { 
  User, 
  Actividad, 
  ITR, 
  KPIs, 
  EstadoITR, 
  Proyecto, 
  Alerta, 
  AppTheme,
  FiltrosDashboard,
  KPIConfig,
  APIKeys
} from "@/types";
import { isWithinInterval, parseISO } from "date-fns";

interface AppContextType {
  // Usuario y autenticación
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isTecnico: boolean;
  
  // Tema de la aplicación
  theme: AppTheme;
  toggleTheme: () => void;
  
  // Proyectos
  proyectos: Proyecto[];
  addProyecto: (proyecto: Proyecto) => void;
  updateProyecto: (id: string, proyecto: Partial<Proyecto>) => void;
  deleteProyecto: (id: string) => void;
  proyectoActual: string | "todos";
  setProyectoActual: (id: string | "todos") => void;
  setProyectos: (proyectos: Proyecto[]) => void; // Required for backups
  
  // Actividades
  actividades: Actividad[];
  setActividades: (actividades: Actividad[]) => void;
  addActividad: (actividad: Actividad) => void;
  updateActividad: (id: string, actividad: Partial<Actividad>) => void;
  deleteActividad: (id: string) => void;
  
  // ITRs
  itrbItems: ITR[];
  setItrbItems: (items: ITR[]) => void;
  addITRB: (itrb: ITR) => void;
  updateITRB: (id: string, itrb: Partial<ITR>) => void;
  deleteITRB: (id: string) => void;
  completarTodosITRB: (proyectoId: string) => void;
  
  // Alertas
  alertas: Alerta[];
  addAlerta: (alerta: Alerta) => void;
  markAlertaAsRead: (id: string) => void;
  deleteAlerta: (id: string) => void;
  setAlertas: (alertas: Alerta[]) => void; // Required for backups
  
  // Filtros
  filtros: FiltrosDashboard;
  setFiltros: (filtros: FiltrosDashboard) => void;
  
  // Configuración de KPIs
  kpiConfig: KPIConfig;
  updateKPIConfig: (config: Partial<KPIConfig>) => void;
  
  // KPIs y estadísticas
  getKPIs: (proyectoId?: string) => KPIs;
  
  // API Keys
  apiKeys: APIKeys;
  updateAPIKeys: (keys: Partial<APIKeys>) => void;
  
  // Validaciones de fechas
  validateFechasProyecto: (fechaInicio: string | Date, fechaFin: string | Date) => boolean;
  validateFechasActividad: (proyectoId: string, fechaInicio: string | Date, fechaFin: string | Date) => boolean;
  validateFechasITR: (proyectoId: string, fechaInicio: string | Date, fechaFin: string | Date) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [itrbItems, setItrbItems] = useState<ITR[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [proyectoActual, setProyectoActual] = useState<string | "todos">("todos");
  const [theme, setTheme] = useState<AppTheme>({ mode: "light" });
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ proyecto: "todos" });
  
  // Configuración de KPIs
  const [kpiConfig, setKPIConfig] = useState<KPIConfig>({
    itrVencidosMostrar: "total", // valores posibles: "total", "diferencia", "pendientes", "completados"
  });
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    openAI: '',
    aiModel: 'gpt-4o'
  });
  
  // Propiedades derivadas
  const isAdmin = user?.role === "admin";
  const isTecnico = user?.role === "tecnico";

  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedProyectos = localStorage.getItem("proyectos");
    if (storedProyectos) {
      setProyectos(JSON.parse(storedProyectos));
    }

    const storedActividades = localStorage.getItem("actividades");
    if (storedActividades) {
      setActividades(JSON.parse(storedActividades));
    }

    const storedITRBs = localStorage.getItem("itrbItems");
    if (storedITRBs) {
      setItrbItems(JSON.parse(storedITRBs));
    }

    const storedAlertas = localStorage.getItem("alertas");
    if (storedAlertas) {
      setAlertas(JSON.parse(storedAlertas));
    }

    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(JSON.parse(storedTheme));
    }
    
    const storedKPIConfig = localStorage.getItem("kpiConfig");
    if (storedKPIConfig) {
      setKPIConfig(JSON.parse(storedKPIConfig));
    }
    
    const storedAPIKeys = localStorage.getItem("apiKeys");
    if (storedAPIKeys) {
      setApiKeys(JSON.parse(storedAPIKeys));
    }
  }, []);

  // Guardar datos en localStorage cuando cambian
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("proyectos", JSON.stringify(proyectos));
  }, [proyectos]);

  useEffect(() => {
    localStorage.setItem("actividades", JSON.stringify(actividades));
  }, [actividades]);

  useEffect(() => {
    localStorage.setItem("itrbItems", JSON.stringify(itrbItems));
    
    // Actualizar automáticamente los estados de los ITR
    const today = new Date();
    const updatedItems = itrbItems.map(item => {
      const fechaFin = new Date(item.fechaFin);
      
      let estado: EstadoITR = "En curso";
      
      if (item.cantidadRealizada >= item.cantidadTotal) {
        estado = "Completado";
      } else if (fechaFin < today) {
        estado = "Vencido";
      }
      
      return { ...item, estado };
    });
    
    if (JSON.stringify(updatedItems) !== JSON.stringify(itrbItems)) {
      setItrbItems(updatedItems);
      
      // Generar alertas para los ITR vencidos
      updatedItems.forEach(item => {
        if (item.estado === "Vencido" && !alertas.some(alerta => 
          alerta.tipo === "Vencimiento" && 
          alerta.itemsRelacionados?.includes(item.id)
        )) {
          addAlerta({
            id: `alerta-${Date.now()}-${item.id}`,
            tipo: "Vencimiento",
            mensaje: `El ITR "${item.nombre}" ha vencido.`,
            fechaCreacion: new Date().toISOString(),
            leida: false,
            itemsRelacionados: [item.id],
            proyectoId: item.proyectoId
          });
        }
      });
    }
  }, [itrbItems]);

  useEffect(() => {
    localStorage.setItem("alertas", JSON.stringify(alertas));
  }, [alertas]);

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(theme));
    // Aplicar clase al body para el tema oscuro/claro
    if (theme.mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem("kpiConfig", JSON.stringify(kpiConfig));
  }, [kpiConfig]);

  useEffect(() => {
    localStorage.setItem("apiKeys", JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Función para actualizar la configuración de KPIs
  const updateKPIConfig = (config: Partial<KPIConfig>) => {
    setKPIConfig(prev => ({ ...prev, ...config }));
  };

  // Función para actualizar las API Keys
  const updateAPIKeys = (keys: Partial<APIKeys>) => {
    setApiKeys(prev => ({ ...prev, ...keys }));
  };

  // Funciones de autenticación
  const login = async (email: string, password?: string): Promise<boolean> => {
    // Simulación de login
    // Para admin se valida contraseña, para técnico solo email
    if (email === "admin@fossil.com" && (password === "admin123" || !password)) {
      setUser({
        email,
        role: "admin",
        nombre: "Administrador"
      });
      return true;
    } else if (email.includes("tecnico") || email.includes("técnico")) {
      // Simular un técnico
      setUser({
        email,
        role: "tecnico",
        nombre: `Técnico ${email.split('@')[0]}`
      });
      return true;
    } else {
      // Cualquier otro email es visualizador
      setUser({
        email,
        role: "viewer",
        nombre: `Usuario ${email.split('@')[0]}`
      });
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    
    // Reset filtros to default
    setFiltros({ proyecto: "todos" });
    
    // Clear localStorage completely to avoid stale data
    localStorage.clear();
    
    // Set default theme
    setTheme({ mode: "light" });
  };

  // Funciones para gestión de tema
  const toggleTheme = () => {
    setTheme(prev => ({
      mode: prev.mode === "light" ? "dark" : "light"
    }));
  };

  // Validaciones de fechas
  const validateFechasProyecto = (fechaInicio: string | Date, fechaFin: string | Date): boolean => {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    
    return inicio <= fin;
  };
  
  const validateFechasActividad = (proyectoId: string, fechaInicio: string | Date, fechaFin: string | Date): boolean => {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    
    if (inicio > fin) return false;
    
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return false;
    
    const proyectoInicio = new Date(proyecto.fechaInicio);
    const proyectoFin = new Date(proyecto.fechaFin);
    
    return inicio >= proyectoInicio && fin <= proyectoFin;
  };
  
  const validateFechasITR = (proyectoId: string, fechaInicio: string | Date, fechaFin: string | Date): boolean => {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    
    if (inicio > fin) return false;
    
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return false;
    
    const proyectoInicio = new Date(proyecto.fechaInicio);
    const proyectoFin = new Date(proyecto.fechaFin);
    
    return inicio >= proyectoInicio && fin <= proyectoFin;
  };

  // Funciones CRUD para proyectos
  const addProyecto = (proyecto: Proyecto) => {
    // Validar que las fechas del proyecto sean válidas
    if (!validateFechasProyecto(proyecto.fechaInicio, proyecto.fechaFin)) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
    }
    
    setProyectos([...proyectos, proyecto]);
  };

  const updateProyecto = (id: string, proyectoUpdates: Partial<Proyecto>) => {
    // Obtener el proyecto actual para combinar con las actualizaciones
    const currentProyecto = proyectos.find(p => p.id === id);
    if (!currentProyecto) return;
    
    // Verificar si se actualizan las fechas
    if (proyectoUpdates.fechaInicio || proyectoUpdates.fechaFin) {
      const newFechaInicio = proyectoUpdates.fechaInicio || currentProyecto.fechaInicio;
      const newFechaFin = proyectoUpdates.fechaFin || currentProyecto.fechaFin;
      
      if (!validateFechasProyecto(newFechaInicio, newFechaFin)) {
        throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
      }
      
      // Validar que las actividades e ITRs sigan siendo válidas con las nuevas fechas del proyecto
      const proyectoActividades = actividades.filter(a => a.proyectoId === id);
      const proyectoITRs = itrbItems.filter(itr => itr.proyectoId === id);
      
      if (proyectoActividades.some(a => {
        return !isWithinInterval(new Date(a.fechaInicio), {
          start: new Date(newFechaInicio),
          end: new Date(newFechaFin)
        }) || !isWithinInterval(new Date(a.fechaFin), {
          start: new Date(newFechaInicio),
          end: new Date(newFechaFin)
        });
      })) {
        throw new Error("Hay actividades que quedarían fuera del rango de fechas del proyecto");
      }
      
      if (proyectoITRs.some(itr => {
        return !isWithinInterval(new Date(itr.fechaInicio), {
          start: new Date(newFechaInicio),
          end: new Date(newFechaFin)
        }) || !isWithinInterval(new Date(itr.fechaFin), {
          start: new Date(newFechaInicio),
          end: new Date(newFechaFin)
        });
      })) {
        throw new Error("Hay ITRs que quedarían fuera del rango de fechas del proyecto");
      }
    }
    
    const updatedProyecto = { 
      ...currentProyecto, 
      ...proyectoUpdates,
      fechaActualizacion: new Date().toISOString()
    };
    
    setProyectos(proyectos.map(p => p.id === id ? updatedProyecto : p));
  };

  const deleteProyecto = (id: string) => {
    setProyectos(proyectos.filter(p => p.id !== id));
    // Eliminar actividades y ITRs asociados
    setActividades(actividades.filter(a => a.proyectoId !== id));
    setItrbItems(itrbItems.filter(i => i.proyectoId !== id));
    // Eliminar alertas asociadas
    setAlertas(alertas.filter(a => a.proyectoId !== id));
    
    // Si el proyecto actual es el que se está eliminando, cambiar a "todos"
    if (proyectoActual === id) {
      setProyectoActual("todos");
    }
  };

  // Funciones CRUD para actividades
  const addActividad = (actividad: Actividad) => {
    // Validar que las fechas de la actividad estén dentro del rango del proyecto
    if (!validateFechasActividad(actividad.proyectoId, actividad.fechaInicio, actividad.fechaFin)) {
      throw new Error("Las fechas de la actividad deben estar dentro del rango del proyecto");
    }
    
    // Si tiene dependencias, validar que existan y que las fechas sean coherentes
    if (actividad.dependencias && actividad.dependencias.length > 0) {
      const actividadesDependientes = actividades.filter(a => 
        actividad.dependencias?.includes(a.id)
      );
      
      if (actividadesDependientes.length !== actividad.dependencias.length) {
        throw new Error("Algunas actividades dependientes no existen");
      }
      
      // Verificar que la fecha de inicio sea posterior a la fecha de fin de todas las dependencias
      const fechaInicio = new Date(actividad.fechaInicio);
      const algunaDependenciaInvalida = actividadesDependientes.some(dep => {
        const fechaFinDependencia = new Date(dep.fechaFin);
        return fechaInicio < fechaFinDependencia;
      });
      
      if (algunaDependenciaInvalida) {
        throw new Error("La fecha de inicio debe ser posterior a la fecha de fin de todas las dependencias");
      }
    }
    
    setActividades([...actividades, actividad]);
  };

  const updateActividad = (id: string, actividadUpdates: Partial<Actividad>) => {
    const currentActividad = actividades.find(act => act.id === id);
    if (!currentActividad) return;
    
    // Si se actualiza el proyecto, validar que las fechas sigan siendo válidas
    const proyectoId = actividadUpdates.proyectoId || currentActividad.proyectoId;
    const fechaInicio = actividadUpdates.fechaInicio || currentActividad.fechaInicio;
    const fechaFin = actividadUpdates.fechaFin || currentActividad.fechaFin;
    
    if (!validateFechasActividad(proyectoId, fechaInicio, fechaFin)) {
      throw new Error("Las fechas de la actividad deben estar dentro del rango del proyecto");
    }
    
    // Si se actualizan las dependencias, validarlas
    if (actividadUpdates.dependencias) {
      const actividadesDependientes = actividades.filter(a => 
        actividadUpdates.dependencias?.includes(a.id)
      );
      
      if (actividadesDependientes.length !== actividadUpdates.dependencias.length) {
        throw new Error("Algunas actividades dependientes no existen");
      }
      
      // Verificar que la fecha de inicio sea posterior a la fecha de fin de todas las dependencias
      const fechaInicioActividad = new Date(fechaInicio);
      const algunaDependenciaInvalida = actividadesDependientes.some(dep => {
        const fechaFinDependencia = new Date(dep.fechaFin);
        return fechaInicioActividad < fechaFinDependencia;
      });
      
      if (algunaDependenciaInvalida) {
        throw new Error("La fecha de inicio debe ser posterior a la fecha de fin de todas las dependencias");
      }
    }
    
    // Validar ITRs relacionados
    if (actividadUpdates.fechaInicio || actividadUpdates.fechaFin) {
      const itrsRelacionados = itrbItems.filter(itr => itr.actividadId === id);
      
      if (itrsRelacionados.some(itr => {
        const itrInicio = new Date(itr.fechaInicio);
        const itrFin = new Date(itr.fechaFin);
        const actividadInicio = new Date(fechaInicio);
        const actividadFin = new Date(fechaFin);
        
        return itrInicio < actividadInicio || itrFin > actividadFin;
      })) {
        throw new Error("Hay ITRs relacionados que quedarían fuera del rango de fechas de la actividad");
      }
    }
    
    const updatedActividad = { ...currentActividad, ...actividadUpdates };
    setActividades(actividades.map(act => act.id === id ? updatedActividad : act));
  };

  const deleteActividad = (id: string) => {
    setActividades(actividades.filter(act => act.id !== id));
    
    // Eliminar ITRs asociados directamente
    setItrbItems(itrbItems.filter(item => item.actividadId !== id));
    
    // Actualizar dependencias en otras actividades
    setActividades(actividades.map(act => {
      if (act.dependencias?.includes(id)) {
        return {
          ...act,
          dependencias: act.dependencias.filter(depId => depId !== id)
        };
      }
      return act;
    }));
  };

  // Funciones CRUD para ITRs
  const addITRB = (itrb: ITR) => {
    // Validar que las fechas del ITR estén dentro del rango del proyecto
    if (!validateFechasITR(itrb.proyectoId, itrb.fechaInicio, itrb.fechaFin)) {
      throw new Error("Las fechas del ITR deben estar dentro del rango del proyecto");
    }
    
    // Si está asociado a una actividad, validar que las fechas estén dentro del rango de la actividad
    if (itrb.actividadId) {
      const actividad = actividades.find(a => a.id === itrb.actividadId);
      if (actividad) {
        const actividadInicio = new Date(actividad.fechaInicio);
        const actividadFin = new Date(actividad.fechaFin);
        const itrbInicio = new Date(itrb.fechaInicio);
        const itrbFin = new Date(itrb.fechaFin);
        
        if (itrbInicio < actividadInicio || itrbFin > actividadFin) {
          throw new Error("Las fechas del ITR deben estar dentro del rango de la actividad relacionada");
        }
      } else {
        throw new Error("La actividad relacionada no existe");
      }
    }
    
    setItrbItems([...itrbItems, itrb]);
  };

  const updateITRB = (id: string, itrbUpdates: Partial<ITR>) => {
    const currentITRB = itrbItems.find(item => item.id === id);
    if (!currentITRB) return;
    
    // Validar cambios en las fechas o proyecto
    const proyectoId = itrbUpdates.proyectoId || currentITRB.proyectoId;
    const fechaInicio = itrbUpdates.fechaInicio || currentITRB.fechaInicio;
    const fechaFin = itrbUpdates.fechaFin || currentITRB.fechaFin;
    
    if (!validateFechasITR(proyectoId, fechaInicio, fechaFin)) {
      throw new Error("Las fechas del ITR deben estar dentro del rango del proyecto");
    }
    
    // Si está asociado a una actividad, validar fechas
    const actividadId = itrbUpdates.actividadId || currentITRB.actividadId;
    if (actividadId) {
      const actividad = actividades.find(a => a.id === actividadId);
      if (actividad) {
        const actividadInicio = new Date(actividad.fechaInicio);
        const actividadFin = new Date(actividad.fechaFin);
        const itrbInicio = new Date(fechaInicio);
        const itrbFin = new Date(fechaFin);
        
        if (itrbInicio < actividadInicio || itrbFin > actividadFin) {
          throw new Error("Las fechas del ITR deben estar dentro del rango de la actividad relacionada");
        }
      } else {
        throw new Error("La actividad relacionada no existe");
      }
    }
    
    const updatedITRB = { ...currentITRB, ...itrbUpdates };
    setItrbItems(itrbItems.map(item => item.id === id ? updatedITRB : item));
  };

  const deleteITRB = (id: string) => {
    setItrbItems(itrbItems.filter(item => item.id !== id));
    
    // Eliminar alertas relacionadas
    setAlertas(alertas.filter(a => !a.itemsRelacionados?.includes(id)));
  };

  // Función para completar todos los ITRs de un proyecto
  const completarTodosITRB = (proyectoId: string) => {
    setItrbItems(itrbItems.map(item => {
      if (item.proyectoId === proyectoId) {
        return {
          ...item,
          cantidadRealizada: item.cantidadTotal,
          estado: "Completado" as EstadoITR
        };
      }
      return item;
    }));
  };

  // Funciones para alertas
  const addAlerta = (alerta: Alerta) => {
    setAlertas([...alertas, alerta]);
  };

  const markAlertaAsRead = (id: string) => {
    setAlertas(alertas.map(a => a.id === id ? { ...a, leida: true } : a));
  };

  const deleteAlerta = (id: string) => {
    setAlertas(alertas.filter(a => a.id !== id));
  };

  // Calcular KPIs
  const getKPIs = (proyectoId?: string): KPIs => {
    // Filtrar por proyecto si es necesario
    const actividadesFiltradas = proyectoId ? 
      actividades.filter(a => a.proyectoId === proyectoId) : 
      actividades;
    
    const itrsFiltrados = proyectoId ?
      itrbItems.filter(i => i.proyectoId === proyectoId) :
      itrbItems;
    
    const totalITRB = itrsFiltrados.reduce((sum, item) => sum + item.cantidadTotal, 0);
    const realizadosITRB = itrsFiltrados.reduce((sum, item) => sum + item.cantidadRealizada, 0);
    
    const avanceFisico = totalITRB > 0 ? (realizadosITRB / totalITRB) * 100 : 0;
    
    // Contar subsistemas únicos
    const todosSubsistemas = new Set(
      actividadesFiltradas.map(a => `${a.sistema}-${a.subsistema}`)
    );
    
    // Contar subsistemas únicos con MCC
    const subsistemasMCC = new Set(
      itrsFiltrados
        .filter(item => item.mcc)
        .map(item => {
          const actividad = actividades.find(act => act.id === item.actividadId);
          return actividad ? `${actividad.sistema}-${actividad.subsistema}` : "";
        })
        .filter(Boolean)
    ).size;
    
    // Contar actividades vencidas
    const hoy = new Date();
    const itrsVencidos = itrsFiltrados.filter(item => {
      const fechaFin = new Date(item.fechaFin);
      return fechaFin < hoy && item.estado !== "Completado";
    });
    
    const actividadesVencidas = itrsVencidos.length;
    
    return {
      avanceFisico,
      totalITRB,
      realizadosITRB,
      subsistemasMCC,
      actividadesVencidas,
      totalSubsistemas: todosSubsistemas.size,
      proyectoId
    };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isAdmin,
        isTecnico,
        theme,
        toggleTheme,
        proyectos,
        addProyecto,
        updateProyecto,
        deleteProyecto,
        proyectoActual,
        setProyectoActual,
        setProyectos,
        actividades,
        setActividades,
        addActividad,
        updateActividad,
        deleteActividad,
        itrbItems,
        setItrbItems,
        addITRB,
        updateITRB,
        deleteITRB,
        completarTodosITRB,
        alertas,
        addAlerta,
        markAlertaAsRead,
        deleteAlerta,
        setAlertas,
        filtros,
        setFiltros,
        kpiConfig,
        updateKPIConfig,
        apiKeys,
        updateAPIKeys,
        getKPIs,
        validateFechasProyecto,
        validateFechasActividad,
        validateFechasITR
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext debe ser usado dentro de un AppProvider");
  }
  return context;
};
