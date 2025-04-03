
/**
 * Utility functions for color handling in Gantt charts
 */

/**
 * Determines the color based on progress and past due status
 */
export const getColorByProgress = (progreso: number, tieneVencidos: boolean): string => {
  if (tieneVencidos) return "#ef4444";
  if (progreso === 100) return "#22c55e";
  if (progreso > 0) return "#f59e0b";
  return "#94a3b8";
};
