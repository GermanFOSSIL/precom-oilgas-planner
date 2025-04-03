
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
      const hoursInDay = [];
      const dayStart = new Date(startDate);
      dayStart.setHours(0, 0, 0, 0);
      
      for (let i = 0; i <= 23; i++) {
        const hourDate = new Date(dayStart);
        hourDate.setHours(i, 0, 0, 0);
        hoursInDay.push(hourDate);
      }
      return hoursInDay;
      
    case "week":
      // Para vista semanal, mostrar cada día
      const weekInterval = { start: startDate, end: endDate };
      return eachDayOfInterval(weekInterval);
      
    case "month":
    default:
      // Para vista mensual, mostrar cada día
      const monthInterval = { start: startDate, end: endDate };
      return eachDayOfInterval(monthInterval);
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
        newEndDate = addDays(newStartDate, 1);
        break;
      case "week":
        newStartDate = startOfWeek(today, { locale: es });
        newEndDate = addDays(newStartDate, 7);
        break;
      case "month":
      default:
        newStartDate = startOfMonth(today);
        newEndDate = addMonths(newStartDate, 1);
        break;
    }
    
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
