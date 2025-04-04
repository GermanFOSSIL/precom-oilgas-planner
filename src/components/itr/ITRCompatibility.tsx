
import React from 'react';
import { ITR } from '@/types';
import { useCompatibility } from '@/context/CompatibilityLayer';

/**
 * Helper component for working with the new ITR structure
 * while maintaining compatibility with components expecting ITRB
 */

interface ITRMapperProps {
  itr: ITR;
  children: (mappedITR: any) => React.ReactNode;
}

export const ITRMapper: React.FC<ITRMapperProps> = ({ itr, children }) => {
  const { getITRFechaLimite } = useCompatibility();
  
  // Create a compatibility layer for components expecting the old ITRB structure
  const compatITR = {
    ...itr,
    // Map new properties to old property names
    descripcion: itr.nombre || itr.descripcion,
    fechaLimite: getITRFechaLimite(itr)
  };
  
  return <>{children(compatITR)}</>;
};

/**
 * Hook to get compatibility functions for ITR/ITRB conversion
 */
export const useITRCompatibility = () => {
  const { legacyITRBToITR, getITRFechaLimite } = useCompatibility();
  
  const mapToLegacyITRB = (itr: ITR) => {
    return {
      ...itr,
      descripcion: itr.nombre || itr.descripcion,
      fechaLimite: getITRFechaLimite(itr)
    };
  };
  
  return {
    mapToLegacyITRB,
    legacyITRBToITR
  };
};
