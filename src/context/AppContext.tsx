
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  Actividad, 
  ITRB, 
  KPIs, 
  EstadoITRB, 
  Proyecto, 
  Alerta, 
  AppTheme,
  FiltrosDashboard,
  KPIConfig
} from "@/types";

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
  updateProyecto: (id: string, proyecto: Proyecto) => void;
  deleteProyecto: (id: string) => void;
  proyectoActual: string | "todos";
  setProyectoActual: (id: string | "todos") => void;
  
  // Actividades
  actividades: Actividad[];
  setActividades: (actividades: Actividad[]) => void;
  addActividad: (actividad: Actividad) => void;
  updateActividad: (id: string, actividad: Actividad) => void;
  deleteActividad: (id: string) => void;
  
  // ITRBs
  itrbItems: ITRB[];
  setItrbItems: (items: ITRB[]) => void;
  addITRB: (itrb: ITRB) => void;
  updateITRB: (id: string, itrb: ITRB) => void;
  deleteITRB: (id: string) => void;
  completarTodosITRB: (proyectoId: string) => void;
  
  // Alertas
  alertas: Alerta[];
  addAlerta: (alerta: Alerta) => void;
  markAlertaAsRead: (id: string) => void;
  deleteAlerta: (id: string) => void;
  
  // Filtros
  filtros: FiltrosDashboard;
  setFiltros: (filtros: FiltrosDashboard) => void;
  
  // Configuración de KPIs
  kpiConfig: KPIConfig;
  updateKPIConfig: (config: Partial<KPIConfig>) => void;
  
  // KPIs y estadísticas
  getKPIs: (proyectoId?: string) => KPIs;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [itrbItems, setItrbItems] = useState<ITRB[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [proyectoActual, setProyectoActual] = useState<string | "todos">("todos");
  const [theme, setTheme] = useState<AppTheme>({ mode: "light" });
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ proyecto: "todos" });
  
  // Configuración de KPIs
  const [kpiConfig, setKPIConfig] = useState<KPIConfig>({
    itrVencidosMostrar: "total", // valores posibles: "total", "diferencia", "pendientes", "completados"
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
    
    // Actualizar automáticamente los estados de los ITRB
    const today = new Date();
    const updatedItems = itrbItems.map(item => {
      const fechaLimite = new Date(item.fechaLimite);
      
      let estado: EstadoITRB = "En curso";
      
      if (item.cantidadRealizada >= item.cantidadTotal) {
        estado = "Completado";
      } else if (fechaLimite < today) {
        estado = "Vencido";
      }
      
      return { ...item, estado };
    });
    
    if (JSON.stringify(updatedItems) !== JSON.stringify(itrbItems)) {
      setItrbItems(updatedItems);
      
      // Generar alertas para los ITRB vencidos
      updatedItems.forEach(item => {
        if (item.estado === "Vencido" && !alertas.some(alerta => 
          alerta.tipo === "Vencimiento" && 
          alerta.itemsRelacionados?.includes(item.id)
        )) {
          // Encontrar el proyecto asociado a este ITRB
          const actividad = actividades.find(act => act.id === item.actividadId);
          if (actividad) {
            addAlerta({
              id: `alerta-${Date.now()}-${item.id}`,
              tipo: "Vencimiento",
              mensaje: `El ITR B "${item.descripcion}" ha vencido.`,
              fechaCreacion: new Date().toISOString(),
              leida: false,
              itemsRelacionados: [item.id],
              proyectoId: actividad.proyectoId
            });
          }
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

  // Función para actualizar la configuración de KPIs
  const updateKPIConfig = (config: Partial<KPIConfig>) => {
    setKPIConfig(prev => ({ ...prev, ...config }));
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

  // Funciones CRUD para proyectos
  const addProyecto = (proyecto: Proyecto) => {
    setProyectos([...proyectos, proyecto]);
  };

  const updateProyecto = (id: string, proyecto: Proyecto) => {
    setProyectos(proyectos.map(p => p.id === id ? proyecto : p));
  };

  const deleteProyecto = (id: string) => {
    setProyectos(proyectos.filter(p => p.id !== id));
    // Eliminar actividades y ITRB asociados
    setActividades(actividades.filter(a => a.proyectoId !== id));
    const actividadesIds = actividades
      .filter(a => a.proyectoId === id)
      .map(a => a.id);
    setItrbItems(itrbItems.filter(i => !actividadesIds.includes(i.actividadId)));
    // Eliminar alertas asociadas
    setAlertas(alertas.filter(a => a.proyectoId !== id));
  };

  // Funciones CRUD para actividades
  const addActividad = (actividad: Actividad) => {
    setActividades([...actividades, actividad]);
  };

  const updateActividad = (id: string, actividad: Actividad) => {
    setActividades(actividades.map(act => act.id === id ? actividad : act));
  };

  const deleteActividad = (id: string) => {
    setActividades(actividades.filter(act => act.id !== id));
    // Eliminar ITRB asociados
    setItrbItems(itrbItems.filter(item => item.actividadId !== id));
  };

  // Funciones CRUD para ITRB
  const addITRB = (itrb: ITRB) => {
    setItrbItems([...itrbItems, itrb]);
  };

  const updateITRB = (id: string, itrb: ITRB) => {
    setItrbItems(itrbItems.map(item => item.id === id ? itrb : item));
  };

  const deleteITRB = (id: string) => {
    setItrbItems(itrbItems.filter(item => item.id !== id));
  };

  // Función para completar todos los ITRB de un proyecto
  const completarTodosITRB = (proyectoId: string) => {
    // Obtener IDs de actividades del proyecto
    const actividadesProyecto = actividades
      .filter(a => a.proyectoId === proyectoId)
      .map(a => a.id);
    
    // Actualizar todos los ITRB relacionados
    setItrbItems(itrbItems.map(item => {
      if (actividadesProyecto.includes(item.actividadId)) {
        return {
          ...item,
          cantidadRealizada: item.cantidadTotal,
          estado: "Completado"
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
    
    const actividadesIds = actividadesFiltradas.map(a => a.id);
    
    const itrbFiltrados = itrbItems.filter(i => 
      actividadesIds.includes(i.actividadId)
    );
    
    const totalITRB = itrbFiltrados.reduce((sum, item) => sum + item.cantidadTotal, 0);
    const realizadosITRB = itrbFiltrados.reduce((sum, item) => sum + item.cantidadRealizada, 0);
    
    const avanceFisico = totalITRB > 0 ? (realizadosITRB / totalITRB) * 100 : 0;
    
    // Contar subsistemas únicos
    const todosSubsistemas = new Set(
      actividadesFiltradas.map(a => `${a.sistema}-${a.subsistema}`)
    );
    
    // Contar subsistemas únicos con CCC
    const subsistemasCCC = new Set(
      itrbFiltrados
        .filter(item => item.ccc)
        .map(item => {
          const actividad = actividades.find(act => act.id === item.actividadId);
          return actividad ? `${actividad.sistema}-${actividad.subsistema}` : "";
        })
        .filter(Boolean)
    ).size;
    
    // Contar actividades vencidas (mejorado)
    const hoy = new Date();
    const itrbsVencidos = itrbFiltrados.filter(item => {
      const fechaLimite = new Date(item.fechaLimite);
      return fechaLimite < hoy; // Es vencido si la fecha límite es anterior a hoy
    });
    
    const actividadesVencidas = itrbsVencidos.filter(item => item.estado !== "Completado").length;
    
    return {
      avanceFisico,
      totalITRB,
      realizadosITRB,
      subsistemasCCC,
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
        filtros,
        setFiltros,
        kpiConfig,
        updateKPIConfig,
        getKPIs
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
