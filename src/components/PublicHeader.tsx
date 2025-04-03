
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, User, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PublicHeaderProps {
  onLoginClick?: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ onLoginClick }) => {
  const { login } = useAppContext();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validar el formato del correo electrónico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Por favor ingrese un correo electrónico válido");
      }
  
      // Intentar login
      const success = await login(email, isAdmin ? password : undefined);
      
      if (success) {
        setIsLoginOpen(false);
        // If external handler exists, call it
        if (onLoginClick) {
          onLoginClick();
        }
      } else {
        throw new Error("Credenciales incorrectas");
      }
    } catch (error: any) {
      alert(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      setIsLoginOpen(true);
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
        </div>
      </div>
      
      {!onLoginClick && (
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Iniciar sesión</DialogTitle>
              <DialogDescription>
                Ingrese sus credenciales para acceder como administrador o técnico.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use admin@fossil.com para acceso como administrador.
                  <br />
                  Use tecnico@ejemplo.com para acceso como técnico.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  id="isAdmin"
                  type="checkbox"
                  className="rounded"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <label htmlFor="isAdmin" className="text-sm">
                  Soy administrador (requiere contraseña)
                </label>
              </div>
              
              {isAdmin && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    Para administrador, use la contraseña "admin123".
                  </p>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsLoginOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Ingresar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
};

export default PublicHeader;
