
/**
 * Utility functions for color handling in Gantt charts
 */

/**
 * Determines the color based on progress and past due status
 */
export const getColorByProgress = (progreso: number, tieneVencidos: boolean): string => {
  if (tieneVencidos) return "#ef4444"; // Rojo para vencidos
  if (progreso === 100) return "#22c55e"; // Verde para completados
  if (progreso > 0) return "#f59e0b"; // Amarillo para en progreso
  return "#94a3b8"; // Gris para no iniciados
};

/**
 * Get color for project status indicators
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Completado":
      return "#22c55e";  // Verde
    case "En curso":
      return "#f59e0b";  // Amarillo
    case "Vencido":
      return "#ef4444";  // Rojo
    case "Actividad":
      return "#94a3b8";  // Gris
    default:
      return "#94a3b8";  // Gris por defecto
  }
};

/**
 * Get background color for rows with alternating colors
 */
export const getRowBackgroundColor = (index: number, isDarkMode: boolean): string => {
  if (isDarkMode) {
    return index % 2 === 0 ? "#1e293b" : "#0f172a";
  }
  return index % 2 === 0 ? "#f8fafc" : "#f1f5f9";
};
