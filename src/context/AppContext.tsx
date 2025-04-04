
import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from "react";
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
  KPIConfig,
  APIKeys
} from "@/types";
import { persistentStorage } from "@/services/PersistentStorage";
import { toast } from "sonner";

interface AppContextType {
  // Usuario y autenticación
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isTecnico: boolean;
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  
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
  setProyectos: (proyectos: Proyecto[]) => void;
  
  // Actividades
  actividades: Actividad[];
  setActividades: (actividades: Actividad[]) => void;
  addActividad: (actividad: Actividad) => void;
  updateActividad: (id: string, actividad: Actividad) => void;
  deleteActividad: (id: string) => void;
  
  // ITRs
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
  setAlertas: (alertas: Alerta[]) => void;
  
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
  
  // Respaldo automático
  createManualBackup: () => string;
  restoreFromBackup: (backupData: string) => boolean;
  getLastBackupTime: () => string;
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
    itrVencidosMostrar: "total",
  });
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    openAI: '',
    aiModel: 'gpt-4o'
  });
  
  // Propiedades derivadas
  const isAdmin = user?.role === "admin";
  const isTecnico = user?.role === "tecnico";

  // Usuarios del sistema (simulación de base de datos)
  const [allUsers, setAllUsers] = useState<{[email: string]: User & {password: string}}>({
    "admin@fossil.com": {
      email: "admin@fossil.com",
      role: "admin",
      nombre: "Administrador",
      password: "admin123"
    },
    "tecnico@ejemplo.com": {
      email: "tecnico@ejemplo.com",
      role: "tecnico",
      nombre: "Técnico Ejemplo",
      password: "tecnico123"
    },
    "viewer@ejemplo.com": {
      email: "viewer@ejemplo.com",
      role: "viewer",
      nombre: "Visualizador",
      password: "viewer123"
    }
  });

  // Cargar datos desde el almacenamiento persistente al iniciar
  useEffect(() => {
    const storedUser = persistentStorage.getItem<User>("user");
    if (storedUser) {
      setUser(storedUser);
    }

    const storedProyectos = persistentStorage.getItem<Proyecto[]>("proyectos");
    if (storedProyectos) {
      setProyectos(storedProyectos);
    }

    const storedActividades = persistentStorage.getItem<Actividad[]>("actividades");
    if (storedActividades) {
      setActividades(storedActividades);
    }

    const storedITRBs = persistentStorage.getItem<ITRB[]>("itrbItems");
    if (storedITRBs) {
      setItrbItems(storedITRBs);
    }

    const storedAlertas = persistentStorage.getItem<Alerta[]>("alertas");
    if (storedAlertas) {
      setAlertas(storedAlertas);
    }

    const storedTheme = persistentStorage.getItem<AppTheme>("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
    
    const storedKPIConfig = persistentStorage.getItem<KPIConfig>("kpiConfig");
    if (storedKPIConfig) {
      setKPIConfig(storedKPIConfig);
    }
    
    const storedAPIKeys = persistentStorage.getItem<APIKeys>("apiKeys");
    if (storedAPIKeys) {
      setApiKeys(storedAPIKeys);
    }
    
    const storedUsers = persistentStorage.getItem<{[email: string]: User & {password: string}}>("allUsers");
    if (storedUsers) {
      setAllUsers(storedUsers);
    }
  }, []);

  // Guardar datos en almacenamiento persistente cuando cambian
  useEffect(() => {
    if (user) {
      persistentStorage.setItem("user", user);
    } else {
      persistentStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    persistentStorage.setItem("proyectos", proyectos);
  }, [proyectos]);

  useEffect(() => {
    persistentStorage.setItem("actividades", actividades);
  }, [actividades]);

  useEffect(() => {
    persistentStorage.setItem("itrbItems", itrbItems);
    
    // Actualizar automáticamente los estados de los ITR
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
      
      // Generar alertas para los ITR vencidos
      updatedItems.forEach(item => {
        if (item.estado === "Vencido" && !alertas.some(alerta => 
          alerta.tipo === "Vencimiento" && 
          alerta.itemsRelacionados?.includes(item.id)
        )) {
          // Encontrar el proyecto asociado a este ITR
          const actividad = actividades.find(act => act.id === item.actividadId);
          if (actividad) {
            addAlerta({
              id: `alerta-${Date.now()}-${item.id}`,
              tipo: "Vencimiento",
              mensaje: `El ITR "${item.descripcion}" ha vencido.`,
              fechaCreacion: new Date().toISOString(),
              leida: false,
              itemsRelacionados: [item.id],
              proyectoId: actividad.proyectoId
            });
          }
        }
      });
    }
  }, [itrbItems, alertas, actividades]);

  useEffect(() => {
    persistentStorage.setItem("alertas", alertas);
  }, [alertas]);

  useEffect(() => {
    persistentStorage.setItem("theme", theme);
    // Aplicar clase al body para el tema oscuro/claro
    if (theme.mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  
  useEffect(() => {
    persistentStorage.setItem("kpiConfig", kpiConfig);
  }, [kpiConfig]);

  useEffect(() => {
    persistentStorage.setItem("apiKeys", apiKeys);
  }, [apiKeys]);
  
  useEffect(() => {
    persistentStorage.setItem("allUsers", allUsers);
  }, [allUsers]);

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
    // Verificar si el usuario existe
    const userData = allUsers[email.toLowerCase()];
    
    if (!userData) {
      // Si el email no está registrado, crear un usuario visualizador
      if (!password) {
        // Crear nuevo usuario
        const newUser: User & {password: string} = {
          email: email.toLowerCase(),
          role: "viewer",
          nombre: `Usuario ${email.split('@')[0]}`,
          password: "viewer123" // Contraseña por defecto
        };
        
        setAllUsers(prev => ({
          ...prev,
          [email.toLowerCase()]: newUser
        }));
        
        setUser({
          email: email.toLowerCase(),
          role: "viewer",
          nombre: `Usuario ${email.split('@')[0]}`
        });
        
        return true;
      }
      return false;
    }
    
    // Si es admin o se proporciona contraseña, validar
    if (userData.role === "admin" || password) {
      if (password && password !== userData.password) {
        return false; // Contraseña incorrecta
      }
      
      // Login exitoso
      setUser({
        email: userData.email,
        role: userData.role,
        nombre: userData.nombre
      });
      
      // Guardar la sesión
      persistentStorage.setItem("lastSession", Date.now().toString());
      
      return true;
    } else {
      // Para usuarios no admin sin contraseña
      setUser({
        email: userData.email,
        role: userData.role,
        nombre: userData.nombre
      });
      
      // Guardar la sesión
      persistentStorage.setItem("lastSession", Date.now().toString());
      
      return true;
    }
  };

  const changePassword = async (email: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    // Verificar si el usuario existe
    const userData = allUsers[email.toLowerCase()];
    
    if (!userData) {
      return false;
    }
    
    // Verificar contraseña actual
    if (userData.password !== currentPassword) {
      return false;
    }
    
    // Cambiar contraseña
    const updatedUser = {
      ...userData,
      password: newPassword
    };
    
    setAllUsers(prev => ({
      ...prev,
      [email.toLowerCase()]: updatedUser
    }));
    
    return true;
  };

  const logout = () => {
    setUser(null);
    
    // Reset filtros to default
    setFiltros({ proyecto: "todos" });
    
    // Mantener los datos pero eliminar la sesión
    persistentStorage.removeItem("lastSession");
    persistentStorage.removeItem("user");
    
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
          estado: "Completado" as EstadoITRB
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
    // Código de KPIs sin cambios
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
    
    // Contar subsistemas únicos con MCC (changed from CCC)
    const subsistemasMCC = new Set(
      itrbFiltrados
        .filter(item => item.mcc) // Changed from ccc to mcc
        .map(item => {
          const actividad = actividades.find(act => act.id === item.actividadId);
          return actividad ? `${actividad.sistema}-${actividad.subsistema}` : "";
        })
        .filter(Boolean)
    ).size;
    
    // Contar actividades vencidas
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
      subsistemasMCC,
      actividadesVencidas,
      totalSubsistemas: todosSubsistemas.size,
      proyectoId
    };
  };

  // Funciones para respaldo de datos
  const createManualBackup = (): string => {
    persistentStorage.createBackup();
    toast.success("Respaldo manual creado correctamente");
    return persistentStorage.getLastBackupDate();
  };

  const restoreFromBackup = (backupData: string): boolean => {
    const success = persistentStorage.restoreBackup(backupData);
    
    if (success) {
      // Recargar datos después de la restauración
      const storedProyectos = persistentStorage.getItem<Proyecto[]>("proyectos");
      if (storedProyectos) setProyectos(storedProyectos);
      
      const storedActividades = persistentStorage.getItem<Actividad[]>("actividades");
      if (storedActividades) setActividades(storedActividades);
      
      const storedITRBs = persistentStorage.getItem<ITRB[]>("itrbItems");
      if (storedITRBs) setItrbItems(storedITRBs);
      
      const storedAlertas = persistentStorage.getItem<Alerta[]>("alertas");
      if (storedAlertas) setAlertas(storedAlertas);
      
      const storedUsers = persistentStorage.getItem<typeof allUsers>("allUsers");
      if (storedUsers) setAllUsers(storedUsers);
      
      toast.success("Respaldo restaurado correctamente");
    } else {
      toast.error("Error al restaurar el respaldo");
    }
    
    return success;
  };

  const getLastBackupTime = (): string => {
    return persistentStorage.getLastBackupDate();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        changePassword,
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
        createManualBackup,
        restoreFromBackup,
        getLastBackupTime
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
