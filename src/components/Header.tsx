
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilePenLine, FileText, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Header: React.FC = () => {
  const { user, logout, actividades, itrbItems, getKPIs } = useAppContext();

  const exportToPDF = () => {
    const doc = new jsPDF();
    const today = new Date();
    const formattedDate = today.toLocaleDateString("es-ES");
    
    // Título
    doc.setFontSize(18);
    doc.text("Plan de Ejecución de Precomisionado", 14, 20);
    
    // Fecha de exportación
    doc.setFontSize(12);
    doc.text(`Fecha de exportación: ${formattedDate}`, 14, 30);
    
    // KPIs
    const kpis = getKPIs();
    doc.text(`Avance físico total: ${kpis.avanceFisico.toFixed(2)}%`, 14, 40);
    doc.text(`ITR B realizados: ${kpis.realizadosITRB} de ${kpis.totalITRB}`, 14, 46);
    doc.text(`Subsistemas con CCC: ${kpis.subsistemasCCC}`, 14, 52);
    doc.text(`Actividades vencidas: ${kpis.actividadesVencidas}`, 14, 58);
    
    // Tabla ITR B
    const tableData = itrbItems.map(item => {
      const actividad = actividades.find(act => act.id === item.actividadId);
      return [
        item.descripcion,
        actividad?.sistema || "",
        actividad?.subsistema || "",
        `${item.cantidadRealizada}/${item.cantidadTotal}`,
        `${((item.cantidadRealizada / item.cantidadTotal) * 100).toFixed(2)}%`,
        item.estado,
        item.ccc ? "Sí" : "No",
        new Date(item.fechaLimite).toLocaleDateString("es-ES")
      ];
    });
    
    (doc as any).autoTable({
      head: [["Descripción", "Sistema", "Subsistema", "Realizados/Total", "Avance", "Estado", "CCC", "Fecha Límite"]],
      body: tableData,
      startY: 65,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] }
    });
    
    doc.save("Plan_Precomisionado.pdf");
  };

  const exportToExcel = () => {
    // Datos para Excel
    const itrbData = itrbItems.map(item => {
      const actividad = actividades.find(act => act.id === item.actividadId);
      return {
        "Descripción": item.descripcion,
        "Sistema": actividad?.sistema || "",
        "Subsistema": actividad?.subsistema || "",
        "Actividad": actividad?.nombre || "",
        "Realizados": item.cantidadRealizada,
        "Total": item.cantidadTotal,
        "Avance": `${((item.cantidadRealizada / item.cantidadTotal) * 100).toFixed(2)}%`,
        "Estado": item.estado,
        "CCC": item.ccc ? "Sí" : "No",
        "Fecha Límite": new Date(item.fechaLimite).toLocaleDateString("es-ES")
      };
    });
    
    const actividadesData = actividades.map(act => ({
      "ID": act.id,
      "Nombre": act.nombre,
      "Sistema": act.sistema,
      "Subsistema": act.subsistema,
      "Fecha Inicio": new Date(act.fechaInicio).toLocaleDateString("es-ES"),
      "Fecha Fin": new Date(act.fechaFin).toLocaleDateString("es-ES"),
      "Duración (días)": act.duracion
    }));
    
    // Crear libro Excel
    const wb = XLSX.utils.book_new();
    
    // Añadir hoja de ITRB
    const wsITRB = XLSX.utils.json_to_sheet(itrbData);
    XLSX.utils.book_append_sheet(wb, wsITRB, "ITR B");
    
    // Añadir hoja de Actividades
    const wsAct = XLSX.utils.json_to_sheet(actividadesData);
    XLSX.utils.book_append_sheet(wb, wsAct, "Actividades");
    
    // Guardar archivo
    XLSX.writeFile(wb, "Plan_Precomisionado.xlsx");
  };

  return (
    <header className="border-b sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-oilgas-primary" />
          <h1 className="text-xl font-bold text-oilgas-primary">
            Plan de Precomisionado
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FilePenLine className="h-4 w-4 mr-2" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Exportar a Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {user?.email.split('@')[0]}
                <span className="px-2 py-0.5 text-xs rounded-full bg-oilgas-primary text-white">
                  {user?.role === "admin" ? "Admin" : "Visualizador"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Usuario</DropdownMenuLabel>
              <DropdownMenuItem className="text-xs opacity-50 cursor-default">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
