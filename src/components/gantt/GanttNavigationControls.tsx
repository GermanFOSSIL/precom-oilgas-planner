
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
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
  onNavigate: (direction: "prev" | "next") => void;
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
  return (
    <div className="flex justify-between items-center mb-4 px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentStartDate, "MMM yyyy", { locale: es })} - {format(currentEndDate, "MMM yyyy", { locale: es })}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Tabs
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as "month" | "week" | "day")}
          className="mr-2"
        >
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs px-2 h-6">Mes</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-2 h-6">Semana</TabsTrigger>
            <TabsTrigger value="day" className="text-xs px-2 h-6">Día</TabsTrigger>
          </TabsList>
        </Tabs>
        
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
  );
};

export default GanttNavigationControls;
