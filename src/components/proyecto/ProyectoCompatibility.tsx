
import React from 'react';
import { Proyecto } from '@/types';
import { useCompatibility } from '@/context/CompatibilityLayer';

/**
 * Helper component for working with the new Proyecto structure
 * while maintaining compatibility with components expecting the old structure
 */

interface ProyectoMapperProps {
  proyecto: Proyecto;
  children: (mappedProyecto: any) => React.ReactNode;
}

export const ProyectoMapper: React.FC<ProyectoMapperProps> = ({ proyecto, children }) => {
  // Create a compatibility layer that maintains all fields from the new Proyecto type
  const compatProyecto = {
    ...proyecto
  };
  
  return <>{children(compatProyecto)}</>;
};

/**
 * Hook to get compatibility functions for Proyecto conversion
 */
export const useProyectoCompatibility = () => {
  const { legacyProyectoToProyecto, createCompatibleProyecto, getEmptyProyecto } = useCompatibility();
  
  return {
    legacyProyectoToProyecto,
    createCompatibleProyecto,
    getEmptyProyecto
  };
};
