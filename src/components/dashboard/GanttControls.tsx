
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

// Este componente ahora está vacío ya que eliminamos todos los elementos según lo solicitado
// Se mantiene la estructura del componente para compatibilidad con el código existente
// pero no renderiza ningún elemento en el DOM
const GanttControls: React.FC<GanttControlsProps> = ({
  configuracionGrafico,
  mostrarSubsistemas,
  onTamanoGraficoChange,
  onSubsistemasToggle,
  onExportPDF,
  onExportExcel,
}) => {
  return null;
};

export default GanttControls;
