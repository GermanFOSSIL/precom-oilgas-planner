
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LoginProps } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login: React.FC<LoginProps> = ({ onSuccess, onCancel }) => {
  const { login, changePassword } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<"login" | "changePassword">("login");
  
  // Estado para cambio de contraseña
  const [changeEmail, setChangeEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoadingChange, setIsLoadingChange] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar el formato del correo electrónico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor ingrese un correo electrónico válido");
        setIsLoading(false);
        return;
      }
  
      // Verificar si es administrador
      const success = await login(email, isAdmin ? password : undefined);
      
      if (success) {
        toast.success(`Bienvenido al panel de precomisionado`);
        // Guardar la última sesión
        localStorage.setItem("lastSession", Date.now().toString());
        localStorage.setItem("userName", email.split('@')[0]);
        
        if (onSuccess) {
          onSuccess(email);
        }
      } else {
        toast.error("Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingChange(true);
    
    try {
      // Validaciones
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(changeEmail)) {
        toast.error("Por favor ingrese un correo electrónico válido");
        return;
      }
      
      if (!currentPassword) {
        toast.error("Por favor ingrese su contraseña actual");
        return;
      }
      
      if (newPassword.length < 6) {
        toast.error("La nueva contraseña debe tener al menos 6 caracteres");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      
      // Cambiar contraseña
      const success = await changePassword(changeEmail, currentPassword, newPassword);
      
      if (success) {
        toast.success("Contraseña cambiada correctamente");
        // Limpiar campos
        setChangeEmail("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Volver a la pestaña de login
        setCurrentTab("login");
      } else {
        toast.error("No se pudo cambiar la contraseña. Verifique sus credenciales.");
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      toast.error("Error al cambiar contraseña");
    } finally {
      setIsLoadingChange(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-indigo-600 dark:text-indigo-400">
          Plan de Precomisionado
        </CardTitle>
        <CardDescription className="text-center">
          Sistema de gestión y planificación
        </CardDescription>
      </CardHeader>
      
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "login" | "changePassword")}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
          <TabsTrigger value="changePassword">Cambiar contraseña</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  placeholder="correo@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={isAdmin}
                  onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                />
                <Label
                  htmlFor="isAdmin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Soy administrador (requiere contraseña)
                </Label>
              </div>
              
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isAdmin}
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                <p>Use admin@fossil.com / admin123 para acceder como administrador</p>
                <p>Use tecnico@ejemplo.com para acceder como técnico</p>
                <p>Use cualquier otro correo para acceder como visualizador</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                className={`${onCancel ? '' : 'w-full'} bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600`}
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Ingresar"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="changePassword">
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="change-email">Correo electrónico</Label>
                <Input
                  id="change-email"
                  placeholder="correo@ejemplo.com"
                  type="email"
                  value={changeEmail}
                  onChange={(e) => setChangeEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                disabled={isLoadingChange}
              >
                {isLoadingChange ? "Cambiando contraseña..." : "Cambiar contraseña"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
      
      <div className="p-4 text-center text-xs text-muted-foreground">
        <p>Plan de Precomisionado | © {new Date().getFullYear()} Fossil Energy</p>
      </div>
    </Card>
  );
};

export default Login;
