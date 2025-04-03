
/**
 * Utility functions for color handling in Gantt charts
 */

/**
 * Determines the color based on progress and past due status
 */
export const getColorByProgress = (progreso: number, tieneVencidos: boolean): string => {
  if (tieneVencidos) return "#ef4444"; // Red for overdue
  if (progreso === 100) return "#22c55e"; // Green for completed
  if (progreso > 50) return "#f59e0b"; // Amber for in progress (more than 50%)
  if (progreso > 0) return "#f97316"; // Orange for early progress
  return "#94a3b8"; // Gray for not started
};

/**
 * Get color for project status indicators
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Completado":
      return "#22c55e";  // Green
    case "En curso":
      return "#f59e0b";  // Amber
    case "Vencido":
      return "#ef4444";  // Red
    case "Verificacion":
      return "#f97316";  // Orange
    case "Pendiente":
      return "#3b82f6";  // Blue
    case "Actividad":
    default:
      return "#94a3b8";  // Gray as default
  }
};

/**
 * Get background color for rows with alternating colors
 */
export const getRowBackgroundColor = (index: number, isDarkMode: boolean): string => {
  if (isDarkMode) {
    return index % 2 === 0 ? "#1e293b" : "#0f172a";
  }
  return index % 2 === 0 ? "#ffffff" : "#f8fafc";
};
