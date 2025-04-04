
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PublicHeader from "@/components/PublicHeader";

const UserProfilePage: React.FC = () => {
  const { user, setUser, isAdmin, theme } = useAppContext();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setNombre(user.nombre || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Actualizamos solo el email y el nombre
      const updatedUser = {
        ...user,
        email,
        nombre
      };
      
      // En una aplicación real, aquí haríamos una llamada API para actualizar el usuario
      // Por ahora solo actualizamos el estado local
      setUser(updatedUser);
      
      toast.success("Perfil actualizado correctamente");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error("Error al actualizar el perfil. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl">Perfil de Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="dark:bg-slate-700 dark:border-slate-600"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input 
                    id="nombre" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    className="dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input 
                    id="role" 
                    value={user?.role} 
                    className="dark:bg-slate-700 dark:border-slate-600"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    El rol solo puede ser modificado por un administrador
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="dark:bg-slate-700 dark:border-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
