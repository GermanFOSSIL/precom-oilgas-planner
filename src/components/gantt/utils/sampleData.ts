
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";

// Sample data generator for demo purposes
export function generateSampleData() {
  // Generate some sample projects
  const projects = [
    { id: "proyecto-1", titulo: "LACA 32" },
    { id: "proyecto-2", titulo: "Proyecto Turboexpander" }
  ];

  // Systems per project
  const systems = {
    "proyecto-1": ["2202", "2203"],
    "proyecto-2": ["3301", "3302", "3303"]
  };

  // Subsystems per system
  const subsystems = {
    "2202": ["25110", "25120", "25130"],
    "2203": ["26110", "26120"],
    "3301": ["30111", "30112"],
    "3302": ["30221", "30222"],
    "3303": ["30331"]
  };

  // Activity names to randomly assign
  const activityNames = [
    "Montaje estructural", 
    "Oil Evacuation", 
    "GERMAN", 
    "Instalación de equipos", 
    "Pruebas hidrostáticas",
    "Tendido de cables",
    "ESD and Fire & Gas",
    "Configuración DCS",
    "Torqueo de pernos",
    "Calibración instrumentos"
  ];

  // Generate ITR descriptive names
  const itrNames = [
    "Control dimensional", 
    "Prueba de presión", 
    "Inspección visual", 
    "Verificación de materiales",
    "Torque inspection",
    "Loop test",
    "Megado de cables",
    "Prueba continuidad",
    "PMI",
    "NDT"
  ];

  // States for ITRs
  const itrStates = ["Completado", "En curso", "Vencido"];

  // Generate activities array
  const activities = [];
  const itrItems = [];

  // Current date for reference
  const currentDate = new Date();
  
  // For each project
  for (const project of projects) {
    const projectSystems = systems[project.id];
    
    // For each system in this project
    for (const system of projectSystems) {
      const systemSubsystems = subsystems[system];
      
      // For each subsystem in this system
      for (const subsystem of systemSubsystems) {
        // Generate 1-3 random activities for this subsystem
        const numActivities = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numActivities; i++) {
          // Random activity name
          const activityName = activityNames[Math.floor(Math.random() * activityNames.length)];
          
          // Random start date between 60 days ago and 30 days ago
          const startDaysAgo = Math.floor(Math.random() * 30) + 30;
          const startDate = addDays(currentDate, -startDaysAgo);
          
          // Random end date between 30 days from now and 90 days from now
          const endDaysForward = Math.floor(Math.random() * 60) + 30;
          const endDate = addDays(currentDate, endDaysForward);
          
          // Random progress between 0 and 100
          const progress = Math.floor(Math.random() * 101);
          
          // Determine if any ITRs are overdue
          const hasOverdue = Math.random() < 0.3; // 30% chance of having overdue items
          
          const activityId = uuidv4();
          
          // Add activity to array
          activities.push({
            id: activityId,
            nombre: `${activityName} ${subsystem}`,
            proyectoId: project.id,
            sistema: system,
            subsistema: subsystem,
            fechaInicio: startDate,
            fechaFin: endDate,
            duracion: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
            progreso: progress,
            tieneVencidos: hasOverdue,
            tieneMCC: Math.random() < 0.5
          });
          
          // Generate 1-12 ITRs for this activity
          const numITRs = Math.floor(Math.random() * 12) + 1;
          
          for (let j = 0; j < numITRs; j++) {
            // Get a random ITR name
            const itrName = itrNames[Math.floor(Math.random() * itrNames.length)];
            
            // Random state - weight towards "En curso"
            let state;
            const stateRandom = Math.random();
            if (stateRandom < 0.3) {
              state = "Completado";
            } else if (stateRandom < 0.8) {
              state = "En curso";
            } else {
              state = "Vencido";
            }
            
            // Random date for ITR within activity range, slightly weighted towards end
            const itrbDateOffset = Math.floor(
              Math.random() * (endDate.getTime() - startDate.getTime())
            );
            const itrbDate = new Date(startDate.getTime() + itrbDateOffset);
            
            // Random quantities for progress tracking
            const totalQuantity = Math.floor(Math.random() * 10) + 1;
            let completedQuantity;
            
            if (state === "Completado") {
              completedQuantity = totalQuantity;
            } else if (state === "Vencido") {
              completedQuantity = Math.floor(Math.random() * (totalQuantity - 1));
            } else {
              completedQuantity = Math.floor(Math.random() * totalQuantity);
            }
            
            // Add ITR to array
            itrItems.push({
              id: uuidv4(),
              actividadId: activityId,
              descripcion: `${itrName} ${j+1}`,
              fechaVencimiento: itrbDate,
              fechaLimite: itrbDate,
              estado: state,
              cantidadTotal: totalQuantity,
              cantidadRealizada: completedQuantity,
              ccc: Math.random() < 0.2 // 20% chance of having CCC
            });
          }
        }
      }
    }
  }
  
  return {
    proyectos: projects,
    actividades: activities,
    itrbItems: itrItems
  };
}

// Function to process the raw data into the format needed by the Gantt chart
export function processDataForGantt(actividades, itrbItems, proyectos, filtros) {
  // Filter activities based on selected filters
  const filteredActivities = actividades.filter(actividad => {
    // Filter by project if specified
    if (filtros.proyecto && filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
      return false;
    }
    
    // Filter by system if specified
    if (filtros.sistema && actividad.sistema !== filtros.sistema) {
      return false;
    }
    
    // Filter by subsystem if specified
    if (filtros.subsistema && actividad.subsistema !== filtros.subsistema) {
      return false;
    }
    
    return true;
  });
  
  // Get related ITRBs for each filtered activity
  const ganttData = filteredActivities.map(actividad => {
    // Find the project related to this activity
    const proyecto = proyectos.find(p => p.id === actividad.proyectoId);
    
    // Get the ITRBs associated with this activity
    const activityItrbs = itrbItems.filter(i => i.actividadId === actividad.id);
    
    // Calculate progress based on completed ITRBs
    const completedItrbs = activityItrbs.filter(i => i.estado === "Completado").length;
    const totalItrbs = activityItrbs.length;
    const progress = totalItrbs > 0 ? Math.round((completedItrbs / totalItrbs) * 100) : 0;
    
    // Check if there are overdue ITRBs
    const today = new Date();
    const hasOverdueItems = activityItrbs.some(
      i => i.estado !== "Completado" && new Date(i.fechaVencimiento) < today
    );
    
    // Determine color based on progress and overdue status
    let color;
    if (hasOverdueItems) {
      color = "#ef4444"; // red for overdue
    } else if (progress === 100) {
      color = "#22c55e"; // green for completed
    } else {
      color = "#f59e0b"; // amber for in progress
    }
    
    return {
      id: actividad.id,
      nombre: actividad.nombre,
      sistema: actividad.sistema,
      subsistema: actividad.subsistema,
      fechaInicio: new Date(actividad.fechaInicio),
      fechaFin: new Date(actividad.fechaFin),
      duracion: actividad.duracion,
      progreso: actividad.progreso || progress,
      tieneVencidos: actividad.tieneVencidos || hasOverdueItems,
      tieneMCC: actividad.tieneMCC || false,
      proyecto: proyecto?.titulo || "Sin proyecto",
      color,
      itrbsAsociados: activityItrbs
    };
  });
  
  return ganttData;
}
