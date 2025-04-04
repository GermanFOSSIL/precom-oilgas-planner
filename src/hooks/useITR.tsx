
import { useAppContext } from '@/context/AppContext';
import { useCompatibility } from '@/context/CompatibilityLayer';
import { ITR } from '@/types';

/**
 * Hook to access ITR data with backward compatibility for components
 * that expect the old ITRB structure
 */
const useITR = () => {
  const { itrbItems, addITRB, updateITRB, deleteITRB } = useAppContext();
  const { getITRFechaLimite, legacyITRBToITR } = useCompatibility();
  
  // Add fechaLimite property for backward compatibility
  const compatItrbItems = itrbItems.map(itr => ({
    ...itr,
    fechaLimite: getITRFechaLimite(itr),
    descripcion: itr.nombre || itr.descripcion
  }));
  
  // Enhanced function to add an ITR with automatic conversion if needed
  const addCompatITR = (itr: any) => {
    // Check if it's already in the new format or needs conversion
    const newITR = 'fechaFin' in itr ? itr : legacyITRBToITR(itr);
    addITRB(newITR);
  };
  
  // Enhanced function to update an ITR with compatibility handling
  const updateCompatITR = (id: string, updates: Partial<any>) => {
    // If updates include fechaLimite but not fechaFin, map it
    if ('fechaLimite' in updates && !('fechaFin' in updates)) {
      updates = {
        ...updates,
        fechaFin: updates.fechaLimite
      };
    }
    
    updateITRB(id, updates);
  };
  
  return {
    itrbItems: compatItrbItems,
    addITRB: addCompatITR,
    updateITRB: updateCompatITR,
    deleteITRB
  };
};

export default useITR;
