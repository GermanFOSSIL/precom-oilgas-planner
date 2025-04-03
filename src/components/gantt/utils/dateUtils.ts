
import { addDays, addWeeks, addMonths, startOfDay, startOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";

// Formatear el eje X según el modo de visualización
export const formatXAxis = (timestamp: number, viewMode: string): string => {
  const date = new Date(timestamp);
  
  switch (viewMode) {
    case "day":
      return format(date, "HH:mm");
    case "week":
      return format(date, "EEE d", { locale: es });
    case "month":
    default:
      return format(date, "d");
  }
};

// Obtener fechas para el eje X según el modo de visualización
export const getAxisDates = (startDate: Date, endDate: Date, viewMode: string): Date[] => {
  switch (viewMode) {
    case "day":
      // Para vista diaria, mostrar intervalos de hora
      const dayInterval = { start: startDate, end: endDate };
      return eachDayOfInterval(dayInterval);
      
    case "week":
      // Para vista semanal, mostrar cada día
      const weekInterval = { start: startDate, end: endDate };
      return eachDayOfInterval(weekInterval);
      
    case "month":
    default:
      // Para vista mensual, mostrar cada semana
      const monthInterval = { start: startDate, end: endDate };
      const allDays = eachDayOfInterval(monthInterval);
      
      // Filtrar para mostrar solo algunos días para evitar sobrecargar el eje
      if (allDays.length > 60) {
        return allDays.filter((_, index) => index % 3 === 0);
      }
      return allDays;
  }
};

// Calcular el nuevo rango de fechas al navegar en el tiempo
export const calculateNewDateRange = (
  currentStartDate: Date,
  currentEndDate: Date,
  direction: "prev" | "next" | "today",
  viewMode: "month" | "week" | "day"
) => {
  const duration = currentEndDate.getTime() - currentStartDate.getTime();
  let newStartDate: Date;
  let newEndDate: Date;

  if (direction === "today") {
    // Centrar en la fecha actual
    const today = new Date();
    
    switch (viewMode) {
      case "day":
        newStartDate = startOfDay(today);
        break;
      case "week":
        newStartDate = startOfWeek(today, { locale: es });
        break;
      case "month":
      default:
        newStartDate = startOfMonth(today);
        break;
    }
    
    newEndDate = new Date(newStartDate.getTime() + duration);
    return { newStartDate, newEndDate };
  }

  // Para navegación prev/next
  switch (viewMode) {
    case "day":
      newStartDate = direction === "prev" 
        ? addDays(currentStartDate, -1)
        : addDays(currentStartDate, 1);
      break;
    case "week":
      newStartDate = direction === "prev" 
        ? addWeeks(currentStartDate, -1)
        : addWeeks(currentStartDate, 1);
      break;
    case "month":
    default:
      newStartDate = direction === "prev" 
        ? addMonths(currentStartDate, -1)
        : addMonths(currentStartDate, 1);
      break;
  }
  
  newEndDate = new Date(newStartDate.getTime() + duration);
  
  return { newStartDate, newEndDate };
};
