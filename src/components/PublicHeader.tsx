
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { CalendarIcon, LogIn, Bot, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface PublicHeaderProps {
  onLoginClick?: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate("/login");
    }
  };

  const handleLogoutClick = () => {
    if (logout) {
      logout();
      navigate("/login");
    }
  };

  return (
    <header className="border-b sticky top-0 z-50 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-oilgas-primary" />
          <h1 className="text-xl font-bold text-oilgas-primary dark:text-white">
            Plan de Precomisionado
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" asChild className="mr-2">
                  <Link to="/ai-assistant">
                    <Bot className="h-4 w-4 mr-2" />
                    Asistente IA
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Consulta nuestro asistente de IA</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {user ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                {user.nombre || user.email || 'Usuario'}
              </Badge>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleLogoutClick} className="border-red-200 text-red-700 hover:bg-red-50">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cerrar tu sesión actual</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleLoginClick}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar sesión
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Acceder como administrador o técnico</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
