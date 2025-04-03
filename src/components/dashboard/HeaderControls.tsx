
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { SunMoon, Download, Image, FileSpreadsheet } from "lucide-react";
import ProyectoSelector from "@/components/ProyectoSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderControlsProps {
  onResetSession: () => void;
  onToggleTheme: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  exportingChart: boolean;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({
  onResetSession,
  onToggleTheme,
  onExportPDF,
  onExportExcel,
  exportingChart,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between mb-6 items-center gap-4">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <ProyectoSelector />

        <Button
          variant="outline"
          size="icon"
          onClick={onResetSession}
          title="Restablecer sesión"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onToggleTheme}
          className="dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          <SunMoon className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              disabled={exportingChart}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onExportPDF} disabled={exportingChart}>
              <Image className="h-4 w-4 mr-2" />
              Generar PDF con Gantt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel} disabled={exportingChart}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default HeaderControls;
