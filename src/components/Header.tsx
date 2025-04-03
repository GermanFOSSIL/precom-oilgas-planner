import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { Database } from "lucide-react";

const Header: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAppContext();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

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
