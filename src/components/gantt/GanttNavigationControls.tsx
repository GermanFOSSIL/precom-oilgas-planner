import React from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  CalendarDays,
  Calendar as CalendarIcon,
  Clock 
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GanttNavigationControlsProps {
  currentStartDate: Date;
  currentEndDate: Date;
  viewMode: "month" | "week" | "day";
  zoomLevel: number;
  onNavigate: (direction: "prev" | "next" | "today") => void;
  onViewModeChange: (viewMode: "month" | "week" | "day") => void;
  onZoomChange: (direction: "in" | "out") => void;
}

const GanttNavigationControls: React.FC<GanttNavigationControlsProps> = ({
  currentStartDate,
  currentEndDate,
  viewMode,
  zoomLevel,
  onNavigate,
  onViewModeChange,
  onZoomChange,
}) => {
  // Formatear la fecha para mostrar en el encabezado del Gantt
  const formatDateRange = () => {
    if (viewMode === "day") {
      return `${format(currentStartDate, "d MMM yyyy", { locale: es })} - ${format(currentEndDate, "d MMM yyyy", { locale: es })}`;
    } else if (viewMode === "week") {
      return `Semana: ${format(currentStartDate, "d MMM", { locale: es })} - ${format(currentEndDate, "d MMM yyyy", { locale: es })}`;
    } else {
      return `${format(currentStartDate, "MMMM yyyy", { locale: es })} - ${format(currentEndDate, "MMMM yyyy", { locale: es })}`;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 px-4 py-2 bg-gray-50 rounded-lg dark:bg-slate-800">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("prev")}
          className="h-8 px-2 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 font-medium px-3 flex-grow whitespace-nowrap overflow-hidden overflow-ellipsis"
              >
                {formatDateRange()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Periodo visualizado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("next")}
          className="h-8 px-2 flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate("today")}
          className="h-8 px-3 hidden sm:flex"
        >
          Hoy
        </Button>
      </div>
      
      <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
        <Tabs
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as "month" | "week" | "day")}
          className="mr-2"
        >
          <TabsList className="h-8 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
            <TabsTrigger value="month" className="text-xs px-2 h-6 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              <span>Mes</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-2 h-6 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>Semana</span>
            </TabsTrigger>
            <TabsTrigger value="day" className="text-xs px-2 h-6 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Día</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onZoomChange("in")}
                  disabled={zoomLevel >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aumentar zoom</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onZoomChange("out")}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reducir zoom</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default GanttNavigationControls;
