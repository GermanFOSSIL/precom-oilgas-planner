
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Actividad, ITRB, KPIs, EstadoITRB } from "@/types";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  actividades: Actividad[];
  setActividades: (actividades: Actividad[]) => void;
  itrbItems: ITRB[];
  setItrbItems: (items: ITRB[]) => void;
  addActividad: (actividad: Actividad) => void;
  updateActividad: (id: string, actividad: Actividad) => void;
  deleteActividad: (id: string) => void;
  addITRB: (itrb: ITRB) => void;
  updateITRB: (id: string, itrb: ITRB) => void;
  deleteITRB: (id: string) => void;
  getKPIs: () => KPIs;
  isAdmin: boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [itrbItems, setItrbItems] = useState<ITRB[]>([]);
  const isAdmin = user?.role === "admin";

  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedActividades = localStorage.getItem("actividades");
    if (storedActividades) {
      setActividades(JSON.parse(storedActividades));
    }

    const storedITRBs = localStorage.getItem("itrbItems");
    if (storedITRBs) {
      setItrbItems(JSON.parse(storedITRBs));
    }
  }, []);

  // Guardar datos en localStorage cuando cambian
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

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
    }
  }, [itrbItems]);

  // Funciones CRUD para actividades
  const addActividad = (actividad: Actividad) => {
    setActividades([...actividades, actividad]);
  };

  const updateActividad = (id: string, actividad: Actividad) => {
    setActividades(actividades.map(act => act.id === id ? actividad : act));
  };

  const deleteActividad = (id: string) => {
    setActividades(actividades.filter(act => act.id !== id));
    // Eliminar ITRB asociados a esta actividad
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

  // Calcular KPIs
  const getKPIs = (): KPIs => {
    const totalITRB = itrbItems.reduce((sum, item) => sum + item.cantidadTotal, 0);
    const realizadosITRB = itrbItems.reduce((sum, item) => sum + item.cantidadRealizada, 0);
    
    const avanceFisico = totalITRB > 0 ? (realizadosITRB / totalITRB) * 100 : 0;
    
    // Contar subsistemas únicos con CCC
    const subsistemasCCC = new Set(
      itrbItems
        .filter(item => item.ccc)
        .map(item => {
          const actividad = actividades.find(act => act.id === item.actividadId);
          return actividad ? actividad.subsistema : "";
        })
    ).size;
    
    // Contar actividades vencidas
    const actividadesVencidas = itrbItems.filter(item => item.estado === "Vencido").length;
    
    return {
      avanceFisico,
      totalITRB,
      realizadosITRB,
      subsistemasCCC,
      actividadesVencidas
    };
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        actividades,
        setActividades,
        itrbItems,
        setItrbItems,
        addActividad,
        updateActividad,
        deleteActividad,
        addITRB,
        updateITRB,
        deleteITRB,
        getKPIs,
        isAdmin,
        logout
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
