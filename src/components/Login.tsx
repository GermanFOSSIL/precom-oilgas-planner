
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PersistentStorage } from "@/services/PersistentStorage";
import { LoginProps } from "@/types";
import { toast } from "sonner";

// Form schema for validation
const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Por favor introduce un email válido." })
    .min(1, { message: "El email es requerido." }),
});

const Login: React.FC<LoginProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);

    try {
      const user = await PersistentStorage.verifyUser(values.email);
      
      if (user) {
        localStorage.setItem("lastSession", Date.now().toString());
        toast.success("Inicio de sesión exitoso", {
          description: `Bienvenido, ${user.nombre || user.email}`,
        });
        onSuccess(values.email);
      } else {
        setError("Usuario no encontrado o credenciales inválidas.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="tu@email.com"
                    {...field}
                    disabled={loading}
                    autoComplete="username"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-1/2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-1/2"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </div>

          <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
            <p>Usuarios de prueba:</p>
            <p>admin@example.com (Admin)</p>
            <p>tecnico@example.com (Técnico)</p>
            <p>viewer@example.com (Visualizador)</p>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Login;
