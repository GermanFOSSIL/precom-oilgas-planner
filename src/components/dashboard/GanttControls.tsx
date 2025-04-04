
import React from "react";
import { ConfiguracionGrafico } from "@/types";

interface GanttControlsProps {
  configuracionGrafico: ConfiguracionGrafico;
  mostrarSubsistemas: boolean;
  onTamanoGraficoChange: (tamano: ConfiguracionGrafico["tamano"]) => void;
  onSubsistemasToggle: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

// Componente simplificado sin los elementos del DOM mencionados
const GanttControls: React.FC<GanttControlsProps> = ({
  configuracionGrafico,
  mostrarSubsistemas,
  onTamanoGraficoChange,
  onSubsistemasToggle,
  onExportPDF,
  onExportExcel,
}) => {
  // Este componente ahora está vacío ya que eliminamos todos los elementos solicitados
  // pero mantenemos la estructura para no romper las referencias existentes
  return null;
};

export default GanttControls;
