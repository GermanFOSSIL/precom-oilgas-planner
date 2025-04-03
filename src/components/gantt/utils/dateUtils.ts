
import { addDays, addWeeks, addMonths, startOfDay, startOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";

// Format the X-axis based on view mode
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

// Get axis dates based on view mode
export const getAxisDates = (startDate: Date, endDate: Date, viewMode: string): Date[] => {
  switch (viewMode) {
    case "day":
      // For daily view, show hourly intervals
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
      // For weekly view, show each day
      return eachDayOfInterval({ start: startDate, end: endDate });
      
    case "month":
    default:
      // For monthly view, show each day
      return eachDayOfInterval({ start: startDate, end: endDate });
  }
};

// Calculate new date range when navigating
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
    // Center on current date
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

  // For prev/next navigation
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
