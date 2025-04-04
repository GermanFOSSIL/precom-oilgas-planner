
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Settings,
  Moon, 
  Sun, 
  Menu,
  X,
  Users
} from "lucide-react";

interface PublicHeaderProps {
  onLoginClick?: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ onLoginClick }) => {
  const { user, logout, isAdmin, toggleTheme, theme } = useAppContext();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 
            className="text-xl font-semibold cursor-pointer"
            onClick={() => navigate("/")}
          >
            Plan de Precomisionado
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                onClick={toggleTheme}
                className="px-2 mr-2"
              >
                {theme.mode === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              
              {/* Menú desplegable para todos los usuarios */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {user.nombre || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate("/user-profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/itr-management")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Administración</span>
                    </DropdownMenuItem>
                  )}
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/itr-management?tab=users")}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Gestión de Usuarios</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={onLoginClick} className="bg-blue-600 hover:bg-blue-700">
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
