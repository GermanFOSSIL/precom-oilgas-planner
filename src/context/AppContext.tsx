
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppContextType, Proyecto, Actividad, ITRB, FiltrosDashboard, ConfiguracionGrafico, KPIConfig, KPIs, User, APIKeys } from "@/types";
import { PersistentStorage } from "@/services/PersistentStorage";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast: shadcnToast } = useToast();
  
  // State for entity data
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [itrbItems, setItrbItems] = useState<ITRB[]>([]);
  
  // Configuration state
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    proyecto: "todos",
    timestamp: new Date().toISOString(),
  });
  const [configuracionGrafico, setConfigurationGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true,
  });
  const [proyectoActual, setProyectoActual] = useState<string>("");
  const [kpiConfig, setKpiConfig] = useState<KPIConfig>({
    itrVencidosMostrar: "total"
  });
  const [apiKeys, setApiKeys] = useState<APIKeys>({});
  
  // Check for session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedEmail = localStorage.getItem("userEmail");
      if (savedEmail) {
        try {
          const userData = await PersistentStorage.verifyUser(savedEmail);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem("userEmail");
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      }
    };
    
    checkSession();
  }, []);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Load data in parallel
          const [proyectosData, actividadesData, itrbsData, kpiConfigData, apiKeysData] = await Promise.all([
            PersistentStorage.getProyectos(),
            PersistentStorage.getActividades(),
            PersistentStorage.getITRBItems(),
            PersistentStorage.getKPIConfig(),
            PersistentStorage.getAPIKeys(),
          ]);
          
          setProyectos(proyectosData);
          setActividades(actividadesData);
          setItrbItems(itrbsData);
          
          if (kpiConfigData) {
            setKpiConfig(kpiConfigData);
          }
          
          if (apiKeysData) {
            setApiKeys(apiKeysData);
          }
          
          // Save email for session persistence
          localStorage.setItem("userEmail", user.email);
          
        } catch (error) {
          console.error("Error loading data:", error);
          toast.error("Error al cargar los datos", {
            description: "Ocurrió un error al cargar los datos de la aplicación."
          });
        }
      };
      
      loadData();
    }
  }, [user]);

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("lastSession");
  };
  
  // Check user roles
  const isAdmin = user?.role === "admin";
  const isTecnico = user?.role === "tecnico" || isAdmin;
  
  // Theme state
  const [theme, setTheme] = useState<{ mode: "light" | "dark" }>({
    mode: (localStorage.getItem("theme") as "light" | "dark") || "light"
  });
  
  const toggleTheme = () => {
    const newMode = theme.mode === "light" ? "dark" : "light";
    setTheme({ mode: newMode });
    localStorage.setItem("theme", newMode);
    
    // Apply theme to document
    if (newMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  
  // Apply theme on mount
  useEffect(() => {
    if (theme.mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme.mode]);

  // Proyecto CRUD operations
  const addProyecto = async (proyecto: Omit<Proyecto, "id" | "fechaCreacion" | "fechaActualizacion">) => {
    try {
      const newProyecto = await PersistentStorage.addProyecto(proyecto);
      setProyectos([...proyectos, newProyecto]);
      toast.success("Proyecto creado", {
        description: `El proyecto "${proyecto.titulo}" ha sido creado exitosamente.`
      });
    } catch (error) {
      console.error("Error adding proyecto:", error);
      toast.error("Error al crear el proyecto", {
        description: `No se pudo crear el proyecto "${proyecto.titulo}".`
      });
    }
  };
  
  const updateProyecto = async (id: string, updates: Partial<Proyecto>) => {
    try {
      const updatedProyecto = await PersistentStorage.updateProyecto(id, updates);
      setProyectos(
        proyectos.map(p => p.id === id ? updatedProyecto : p)
      );
      toast.success("Proyecto actualizado", {
        description: `El proyecto ha sido actualizado exitosamente.`
      });
    } catch (error) {
      console.error("Error updating proyecto:", error);
      toast.error("Error al actualizar el proyecto", {
        description: "No se pudo actualizar el proyecto."
      });
    }
  };
  
  const deleteProyecto = async (id: string) => {
    try {
      await PersistentStorage.deleteProyecto(id);
      setProyectos(proyectos.filter(p => p.id !== id));
      toast.success("Proyecto eliminado", {
        description: `El proyecto ha sido eliminado exitosamente.`
      });
    } catch (error) {
      console.error("Error deleting proyecto:", error);
      toast.error("Error al eliminar el proyecto", {
        description: "No se pudo eliminar el proyecto."
      });
    }
  };

  // Actividad CRUD operations
  const addActividad = async (actividad: Omit<Actividad, "id">) => {
    try {
      const newActividad = await PersistentStorage.addActividad(actividad);
      setActividades([...actividades, newActividad]);
      toast.success("Actividad creada", {
        description: `La actividad "${actividad.nombre}" ha sido creada exitosamente.`
      });
    } catch (error) {
      console.error("Error adding actividad:", error);
      toast.error("Error al crear la actividad", {
        description: `No se pudo crear la actividad "${actividad.nombre}".`
      });
    }
  };
  
  const updateActividad = async (id: string, updates: Partial<Actividad>) => {
    try {
      const updatedActividad = await PersistentStorage.updateActividad(id, updates);
      setActividades(
        actividades.map(a => a.id === id ? updatedActividad : a)
      );
      toast.success("Actividad actualizada", {
        description: `La actividad ha sido actualizada exitosamente.`
      });
    } catch (error) {
      console.error("Error updating actividad:", error);
      toast.error("Error al actualizar la actividad", {
        description: "No se pudo actualizar la actividad."
      });
    }
  };
  
  const deleteActividad = async (id: string) => {
    try {
      await PersistentStorage.deleteActividad(id);
      setActividades(actividades.filter(a => a.id !== id));
      toast.success("Actividad eliminada", {
        description: `La actividad ha sido eliminada exitosamente.`
      });
    } catch (error) {
      console.error("Error deleting actividad:", error);
      toast.error("Error al eliminar la actividad", {
        description: "No se pudo eliminar la actividad."
      });
    }
  };

  // ITRB CRUD operations
  const addITRB = async (itrb: Omit<ITRB, "id">) => {
    try {
      const newITRB = await PersistentStorage.addITRB(itrb);
      setItrbItems([...itrbItems, newITRB]);
      toast.success("ITR creado", {
        description: `El ITR "${itrb.descripcion}" ha sido creado exitosamente.`
      });
    } catch (error) {
      console.error("Error adding ITRB:", error);
      toast.error("Error al crear el ITR", {
        description: `No se pudo crear el ITR "${itrb.descripcion}".`
      });
    }
  };
  
  const updateITRB = async (id: string, updates: Partial<ITRB>) => {
    try {
      const updatedITRB = await PersistentStorage.updateITRB(id, updates);
      setItrbItems(
        itrbItems.map(i => i.id === id ? updatedITRB : i)
      );
      toast.success("ITR actualizado", {
        description: `El ITR ha sido actualizado exitosamente.`
      });
    } catch (error) {
      console.error("Error updating ITRB:", error);
      toast.error("Error al actualizar el ITR", {
        description: "No se pudo actualizar el ITR."
      });
    }
  };
  
  const deleteITRB = async (id: string) => {
    try {
      await PersistentStorage.deleteITRB(id);
      setItrbItems(itrbItems.filter(i => i.id !== id));
      toast.success("ITR eliminado", {
        description: `El ITR ha sido eliminado exitosamente.`
      });
    } catch (error) {
      console.error("Error deleting ITRB:", error);
      toast.error("Error al eliminar el ITR", {
        description: "No se pudo eliminar el ITR."
      });
    }
  };
  
  // Convenience method to update ITRB status
  const updateITRBStatus = async (id: string, estado: "En curso" | "Completado" | "Vencido") => {
    try {
      await updateITRB(id, { estado });
    } catch (error) {
      console.error("Error updating ITRB status:", error);
      throw error;
    }
  };

  // KPI Config operations
  const updateKPIConfig = async (config: Partial<KPIConfig>) => {
    try {
      const updatedConfig = await PersistentStorage.updateKPIConfig(config);
      setKpiConfig(prevConfig => ({
        ...prevConfig,
        ...updatedConfig
      }));
      toast.success("Configuración KPI actualizada", {
        description: "La configuración de KPI ha sido actualizada exitosamente."
      });
    } catch (error) {
      console.error("Error updating KPI config:", error);
      toast.error("Error al actualizar configuración KPI", {
        description: "No se pudo actualizar la configuración de KPI."
      });
    }
  };

  // API Keys operations
  const updateAPIKeys = async (keys: Partial<APIKeys>) => {
    try {
      const updatedKeys = await PersistentStorage.updateAPIKeys(keys);
      setApiKeys(prevKeys => ({
        ...prevKeys,
        ...updatedKeys
      }));
      toast.success("API keys actualizadas", {
        description: "Las claves API han sido actualizadas exitosamente."
      });
    } catch (error) {
      console.error("Error updating API keys:", error);
      toast.error("Error al actualizar las claves API", {
        description: "No se pudieron actualizar las claves API."
      });
    }
  };

  // Calculate KPIs
  const getKPIs = (proyectoId?: string): KPIs => {
    // Filter items based on project
    const filteredActividades = proyectoId 
      ? actividades.filter(a => a.proyectoId === proyectoId) 
      : actividades;
      
    const actividadIds = filteredActividades.map(a => a.id);
    
    const filteredITRBs = itrbItems.filter(i => actividadIds.includes(i.actividadId));
    
    // Calculate KPIs
    const totalITRB = filteredITRBs.length;
    const realizadosITRB = filteredITRBs.filter(i => i.estado === "Completado").length;
    
    // Calculate physical progress
    const avanceFisico = totalITRB > 0 
      ? Math.round((realizadosITRB / totalITRB) * 100) 
      : 0;
    
    // Count systems and subsystems with MCC
    const uniqueSubsystems = new Set<string>();
    const subsystemsWithMCC = new Set<string>();
    
    filteredActividades.forEach(actividad => {
      const subsystemKey = `${actividad.sistema}-${actividad.subsistema}`;
      uniqueSubsystems.add(subsystemKey);
      
      // Check if any ITRB in this activity has MCC
      const activityITRBs = filteredITRBs.filter(i => i.actividadId === actividad.id);
      if (activityITRBs.some(i => i.mcc)) {
        subsystemsWithMCC.add(subsystemKey);
      }
    });
    
    // Count overdue activities
    const now = new Date();
    const actividadesVencidas = filteredActividades.filter(a => {
      return new Date(a.fechaFin) < now;
    }).length;
    
    return {
      avanceFisico,
      totalITRB,
      realizadosITRB,
      subsistemasMCC: subsystemsWithMCC.size,
      totalSubsistemas: uniqueSubsystems.size,
      actividadesVencidas,
      proyectoId
    };
  };
  
  // Login function
  const login = async (email: string): Promise<User | null> => {
    try {
      const userData = await PersistentStorage.verifyUser(email);
      if (userData) {
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error during login:", error);
      return null;
    }
  };

  const contextValue: AppContextType = {
    user,
    setUser,
    logout,
    isAdmin,
    isTecnico,
    theme,
    toggleTheme,
    proyectos,
    actividades,
    itrbItems,
    filtros,
    setFiltros,
    configuracionGrafico,
    setConfigurationGrafico,
    proyectoActual,
    setProyectoActual,
    addProyecto,
    updateProyecto,
    deleteProyecto,
    addActividad,
    updateActividad,
    deleteActividad,
    addITRB,
    updateITRB,
    deleteITRB,
    updateITRBStatus,
    kpiConfig,
    updateKPIConfig,
    apiKeys,
    updateAPIKeys,
    getKPIs,
    login
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
