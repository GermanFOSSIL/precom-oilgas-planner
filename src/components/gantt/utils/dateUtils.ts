
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Utility functions for date handling in Gantt charts
 */

/**
 * Formats a date for the X axis based on the current view mode
 */
export const formatXAxis = (date: number, viewMode: "month" | "week" | "day"): string => {
  const dateObj = new Date(date);
  switch (viewMode) {
    case "day":
      return format(dateObj, "dd MMM", { locale: es });
    case "week":
      return format(dateObj, "dd MMM", { locale: es });
    case "month":
    default:
      return format(dateObj, "MMM yyyy", { locale: es });
  }
};

/**
 * Generates an array of dates based on the current start/end dates and view mode
 */
export const getAxisDates = (
  currentStartDate: Date, 
  currentEndDate: Date, 
  viewMode: "month" | "week" | "day"
): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(currentStartDate);
  
  while (currentDate <= currentEndDate) {
    dates.push(new Date(currentDate));
    
    switch (viewMode) {
      case "day":
        currentDate = addDays(currentDate, 1);
        break;
      case "week":
        currentDate = addDays(currentDate, 7);
        break;
      case "month":
      default:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }
  
  return dates;
};

/**
 * Calculates new date ranges when navigating through time
 */
export const calculateNewDateRange = (
  currentStartDate: Date, 
  currentEndDate: Date, 
  direction: "prev" | "next", 
  viewMode: "month" | "week" | "day"
): { newStartDate: Date, newEndDate: Date } => {
  let newStartDate, newEndDate;
  
  switch (viewMode) {
    case "day":
      newStartDate = direction === "prev" 
        ? addDays(currentStartDate, -7) 
        : addDays(currentStartDate, 7);
      newEndDate = direction === "prev" 
        ? addDays(currentEndDate, -7) 
        : addDays(currentEndDate, 7);
      break;
    case "week":
      newStartDate = direction === "prev" 
        ? addDays(currentStartDate, -28) 
        : addDays(currentStartDate, 28);
      newEndDate = direction === "prev" 
        ? addDays(currentEndDate, -28) 
        : addDays(currentEndDate, 28);
      break;
    case "month":
    default:
      newStartDate = new Date(currentStartDate);
      newEndDate = new Date(currentEndDate);
      if (direction === "prev") {
        newStartDate.setMonth(newStartDate.getMonth() - 3);
        newEndDate.setMonth(newEndDate.getMonth() - 3);
      } else {
        newStartDate.setMonth(newStartDate.getMonth() + 3);
        newEndDate.setMonth(newEndDate.getMonth() + 3);
      }
      break;
  }
  
  return { newStartDate, newEndDate };
};
