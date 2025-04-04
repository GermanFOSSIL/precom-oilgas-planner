
import { useAppContext } from '@/context/AppContext';
import { useCompatibility } from '@/context/CompatibilityLayer';
import { Proyecto } from '@/types';

/**
 * Hook to access Proyecto data with backward compatibility for components
 * that expect the old Proyecto structure
 */
const useProyecto = () => {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useAppContext();
  const { createCompatibleProyecto, getEmptyProyecto } = useCompatibility();
  
  // Enhanced function to add a Proyecto with automatic conversion if needed
  const addCompatProyecto = (proyecto: any) => {
    // Ensure all required fields are present
    if (!proyecto.fechaInicio || !proyecto.fechaFin) {
      proyecto = createCompatibleProyecto(proyecto);
    }
    addProyecto(proyecto);
  };
  
  // Function to get an empty proyecto with all required fields
  const getNuevoProyecto = () => {
    return getEmptyProyecto();
  };
  
  return {
    proyectos,
    addProyecto: addCompatProyecto,
    updateProyecto,
    deleteProyecto,
    getNuevoProyecto
  };
};

export default useProyecto;
