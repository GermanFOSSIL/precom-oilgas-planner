
import React, { createContext, useContext } from 'react';
import { useAppContext } from '@/context/AppContext';
import { convertToITR, convertToProyecto, getITRFechaFin } from '@/utils/typeMigration';
import { ITR, Proyecto } from '@/types';
import { ITRB, LegacyProyecto } from '@/types/compatibility';

// This context provides legacy support for components still using ITRB
interface CompatibilityContextType {
  // Convert old ITRB references to new ITR
  legacyITRBToITR: (itrb: ITRB) => ITR;
  
  // Get fechaLimite (for backward compatibility)
  getITRFechaLimite: (itr: ITR) => string;
  
  // Convert old Proyecto format to new format
  legacyProyectoToProyecto: (proyecto: LegacyProyecto) => Proyecto;
  
  // Create a new proyecto with required fields
  createCompatibleProyecto: (data: Partial<Proyecto>) => Proyecto;
  
  // Create empty proyecto with default values
  getEmptyProyecto: () => Omit<Proyecto, "id" | "fechaCreacion" | "fechaActualizacion">;
}

const CompatibilityContext = createContext<CompatibilityContextType | null>(null);

export const CompatibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  
  const legacyITRBToITR = (itrb: ITRB): ITR => {
    return convertToITR(itrb);
  };
  
  const getITRFechaLimite = (itr: ITR): string => {
    // For backward compatibility, return fechaFin as fechaLimite
    return itr.fechaFin;
  };
  
  const legacyProyectoToProyecto = (proyecto: LegacyProyecto): Proyecto => {
    return convertToProyecto(proyecto);
  };
  
  const createCompatibleProyecto = (data: Partial<Proyecto>): Proyecto => {
    const now = new Date().toISOString();
    return {
      id: data.id || `proyecto-${Date.now()}`,
      titulo: data.titulo || "Nuevo Proyecto",
      descripcion: data.descripcion || "",
      fechaInicio: data.fechaInicio || now.split('T')[0],
      fechaFin: data.fechaFin || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fechaCreacion: now,
      fechaActualizacion: now
    };
  };
  
  const getEmptyProyecto = (): Omit<Proyecto, "id" | "fechaCreacion" | "fechaActualizacion"> => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    return {
      titulo: "",
      descripcion: "",
      fechaInicio: today,
      fechaFin: nextYear.toISOString().split('T')[0]
    };
  };
  
  return (
    <CompatibilityContext.Provider value={{
      legacyITRBToITR,
      getITRFechaLimite,
      legacyProyectoToProyecto,
      createCompatibleProyecto,
      getEmptyProyecto
    }}>
      {children}
    </CompatibilityContext.Provider>
  );
};

export const useCompatibility = () => {
  const context = useContext(CompatibilityContext);
  if (!context) {
    throw new Error('useCompatibility must be used within a CompatibilityProvider');
  }
  return context;
};
