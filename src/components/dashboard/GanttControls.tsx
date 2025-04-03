
import React from "react";
import { ConfiguracionGrafico } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Link, Bot } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GanttControlsProps {
  configuracionGrafico: ConfiguracionGrafico;
  mostrarSubsistemas: boolean;
  onTamanoGraficoChange: (tamano: ConfiguracionGrafico["tamano"]) => void;
  onSubsistemasToggle: () => void;
}

const GanttControls: React.FC<GanttControlsProps> = ({
  configuracionGrafico,
  mostrarSubsistemas,
  onTamanoGraficoChange,
  onSubsistemasToggle,
}) => {
  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onSubsistemasToggle}
        className="flex items-center gap-1"
      >
        {mostrarSubsistemas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {mostrarSubsistemas ? "Ocultar subsistemas" : "Mostrar subsistemas"}
      </Button>

      <Select
        value={configuracionGrafico.tamano || "mediano"}
        onValueChange={(value: "pequeno" | "mediano" | "grande" | "completo") =>
          onTamanoGraficoChange(value)
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Tamaño" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pequeno">Pequeño</SelectItem>
          <SelectItem value="mediano">Mediano</SelectItem>
          <SelectItem value="grande">Grande</SelectItem>
          <SelectItem value="completo">Completo</SelectItem>
        </SelectContent>
      </Select>
      
      <Button variant="outline" size="sm" asChild className="ml-auto">
        <RouterLink to="/ai-assistant" className="flex items-center gap-1">
          <Bot className="h-4 w-4" />
          Asistente IA
        </RouterLink>
      </Button>
    </div>
  );
};

export default GanttControls;
