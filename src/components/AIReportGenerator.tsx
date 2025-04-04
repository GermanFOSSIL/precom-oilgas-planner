
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { Message } from "@/types";

interface AIReportGeneratorProps {
  messages: Message[];
}

const AIReportGenerator: React.FC<AIReportGeneratorProps> = ({ messages }) => {
  const generateReport = () => {
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Título del informe
      doc.setFontSize(18);
      doc.text("Informe de Conversación con Asistente IA", pageWidth / 2, 20, { align: "center" });
      
      // Fecha del informe
      doc.setFontSize(12);
      const fechaActual = new Date().toLocaleDateString("es-ES", {
        year: "numeric", 
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      doc.text(`Generado el: ${fechaActual}`, pageWidth / 2, 30, { align: "center" });
      
      // Contenido de la conversación
      doc.setFontSize(10);
      let y = 50;
      
      messages.forEach((message, index) => {
        // Saltar a una nueva página si no hay suficiente espacio
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        const role = message.role === "user" ? "Usuario" : "Asistente IA";
        const timestamp = message.timestamp instanceof Date 
          ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : "Hora no disponible";
        
        doc.setFont(undefined, "bold");
        doc.text(`${role} - ${timestamp}:`, 10, y);
        y += 7;
        
        doc.setFont(undefined, "normal");
        
        // Dividir el contenido en líneas
        const contentLines = doc.splitTextToSize(message.content, pageWidth - 20);
        
        // Verificar si necesitamos otra página para el contenido
        if (y + contentLines.length * 5 > 280) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(contentLines, 10, y);
        y += contentLines.length * 5 + 10;
      });
      
      // Guardar el documento
      doc.save("informe-asistente-ia.pdf");
      
      toast.success("Informe generado exitosamente");
    } catch (error) {
      console.error("Error al generar informe:", error);
      toast.error("Error al generar el informe");
    }
  };
  
  return (
    <Button variant="outline" size="sm" className="text-xs" onClick={generateReport}>
      <Download className="h-3 w-3 mr-1" />
      Generar informe
    </Button>
  );
};

export default AIReportGenerator;
