
import { ITR, Proyecto } from "@/types";
import { convertToITR, convertToProyecto } from "./typeMigration";

/**
 * Migration utility to update stored data from old format to new format
 */

export const migrateLocalStorageData = () => {
  try {
    // Migrate ITRBs to ITRs
    const storedITRBs = localStorage.getItem('itrbItems');
    if (storedITRBs) {
      const parsedITRBs = JSON.parse(storedITRBs);
      if (Array.isArray(parsedITRBs)) {
        // Convert each ITRB to ITR
        const migratedITRs = parsedITRBs.map(convertToITR);
        localStorage.setItem('itrbItems', JSON.stringify(migratedITRs));
        console.log(`Migrated ${migratedITRs.length} ITRBs to ITRs`);
      }
    }
    
    // Migrate Proyectos
    const storedProyectos = localStorage.getItem('proyectos');
    if (storedProyectos) {
      const parsedProyectos = JSON.parse(storedProyectos);
      if (Array.isArray(parsedProyectos)) {
        // Check if any proyecto needs migration (missing fechaInicio)
        const needsMigration = parsedProyectos.some(p => !p.fechaInicio);
        
        if (needsMigration) {
          // Convert each proyecto to the new format
          const migratedProyectos = parsedProyectos.map(convertToProyecto);
          localStorage.setItem('proyectos', JSON.stringify(migratedProyectos));
          console.log(`Migrated ${migratedProyectos.length} Proyectos to new format`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error migrating data:", error);
    return false;
  }
};

// Run the migration as soon as the module is imported
migrateLocalStorageData();

export default migrateLocalStorageData;
