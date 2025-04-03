
import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Download, FileSpreadsheet } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { Database } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAppContext();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  const handleExportGantt = () => {
    try {
      // Simple check to prevent errors in non-dashboard pages
      const ganttContainer = document.querySelector('.gantt-chart-container');
      if (!ganttContainer) {
        toast.error("No se encontró un gráfico Gantt para exportar");
        return;
      }
      
      // Trigger PDF generation through window event
      const exportEvent = new CustomEvent('export-gantt-pdf');
      window.dispatchEvent(exportEvent);
    } catch (error) {
      console.error("Error al iniciar la exportación:", error);
      toast.error("Error al iniciar la exportación del gráfico Gantt");
    }
  };

  const handleExportExcel = () => {
    try {
      // Trigger Excel generation through window event
      const exportEvent = new CustomEvent('export-gantt-excel');
      window.dispatchEvent(exportEvent);
    } catch (error) {
      console.error("Error al iniciar la exportación a Excel:", error);
      toast.error("Error al iniciar la exportación a Excel");
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold dark:text-white">
          Plan de Precomisionado
        </Link>

        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/itr-management" className="text-gray-700 dark:text-gray-300 hover:underline flex items-center">
                <Database className="h-5 w-5 mr-2" />
                <span>Gestión de ITR</span>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportGantt}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF con Gantt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme.mode === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> : <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </>
          ) : (
            !isLoginPage && !isRegisterPage && (
              <>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:underline">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="text-gray-700 dark:text-gray-300 hover:underline">
                  Registrarse
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
