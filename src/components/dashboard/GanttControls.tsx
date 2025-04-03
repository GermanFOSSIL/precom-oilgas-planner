
import React from "react";
import { ConfiguracionGrafico } from "@/types";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  EyeOff, 
  Link, 
  Bot, 
  FileText, 
  FileSpreadsheet, 
  LayoutGrid, 
  Maximize2,
  Minimize2,
  ArrowUpRight 
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GanttControlsProps {
  configuracionGrafico: ConfiguracionGrafico;
  mostrarSubsistemas: boolean;
  onTamanoGraficoChange: (tamano: ConfiguracionGrafico["tamano"]) => void;
  onSubsistemasToggle: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const GanttControls: React.FC<GanttControlsProps> = ({
  configuracionGrafico,
  mostrarSubsistemas,
  onTamanoGraficoChange,
  onSubsistemasToggle,
  onExportPDF,
  onExportExcel,
}) => {
  const getSizeIcon = () => {
    switch (configuracionGrafico.tamano) {
      case "pequeno": 
        return <Minimize2 className="h-4 w-4 mr-1" />;
      case "grande":
      case "completo":
        return <Maximize2 className="h-4 w-4 mr-1" />;
      default:
        return <LayoutGrid className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onSubsistemasToggle}
              className="flex items-center gap-1 h-8"
            >
              {mostrarSubsistemas ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              <span className="hidden sm:inline">{mostrarSubsistemas ? "Ocultar subsistemas" : "Mostrar subsistemas"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{mostrarSubsistemas ? "Ocultar información de subsistemas" : "Mostrar información de subsistemas"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        value={configuracionGrafico.tamano || "mediano"}
        onValueChange={(value: "pequeno" | "mediano" | "grande" | "completo") =>
          onTamanoGraficoChange(value)
        }
      >
        <SelectTrigger className="w-[110px] h-8">
          <div className="flex items-center">
            {getSizeIcon()}
            <SelectValue placeholder="Tamaño" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pequeno" className="flex items-center">
            <Minimize2 className="h-4 w-4 mr-2" />
            <span>Pequeño</span>
          </SelectItem>
          <SelectItem value="mediano" className="flex items-center">
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span>Mediano</span>
          </SelectItem>
          <SelectItem value="grande" className="flex items-center">
            <Maximize2 className="h-4 w-4 mr-2" />
            <span>Grande</span>
          </SelectItem>
          <SelectItem value="completo" className="flex items-center">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            <span>Completo</span>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {(onExportPDF || onExportExcel) && (
        <div className="flex gap-1 ml-auto">
          {onExportPDF && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportPDF}
                    className="h-8"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar como PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {onExportExcel && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportExcel}
                    className="h-8"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Excel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar como Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      <Button variant="outline" size="sm" asChild className="h-8 ml-auto sm:ml-0">
        <RouterLink to="/ai-assistant" className="flex items-center gap-1">
          <Bot className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Asistente IA</span>
        </RouterLink>
      </Button>
    </div>
  );
};

export default GanttControls;
