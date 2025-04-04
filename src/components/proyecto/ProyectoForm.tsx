
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Proyecto, ProyectoFormData } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface ProyectoFormProps {
  proyectoId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ProyectoForm: React.FC<ProyectoFormProps> = ({ proyectoId, onCancel, onSuccess }) => {
  const { proyectos, addProyecto, updateProyecto, validateFechasProyecto } = useAppContext();
  
  const [formData, setFormData] = useState<ProyectoFormData>({
    titulo: "",
    descripcion: "",
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 3)),
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Si se proporciona un proyectoId, cargar los datos del proyecto existente
  useEffect(() => {
    if (proyectoId) {
      const proyecto = proyectos.find((p) => p.id === proyectoId);
      if (proyecto) {
        setFormData({
          titulo: proyecto.titulo,
          descripcion: proyecto.descripcion,
          fechaInicio: new Date(proyecto.fechaInicio),
          fechaFin: new Date(proyecto.fechaFin),
        });
      }
    }
  }, [proyectoId, proyectos]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpiar errores
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  
  const handleFechaInicioChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, fechaInicio: date }));
      
      // Limpiar errores
      if (errors.fechaInicio) {
        setErrors((prev) => ({ ...prev, fechaInicio: "" }));
      }
    }
  };
  
  const handleFechaFinChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, fechaFin: date }));
      
      // Limpiar errores
      if (errors.fechaFin) {
        setErrors((prev) => ({ ...prev, fechaFin: "" }));
      }
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
    }
    
    if (!validateFechasProyecto(formData.fechaInicio, formData.fechaFin)) {
      newErrors.fechaFin = "La fecha de fin debe ser posterior a la fecha de inicio";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }
    
    setLoading(true);
    
    try {
      if (proyectoId) {
        // Actualizar proyecto existente
        updateProyecto(proyectoId, {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fechaInicio: formData.fechaInicio.toISOString(),
          fechaFin: formData.fechaFin.toISOString(),
          fechaActualizacion: new Date().toISOString(),
        });
        toast.success("Proyecto actualizado correctamente");
      } else {
        // Crear nuevo proyecto
        const nuevoProyecto: Proyecto = {
          id: uuidv4(),
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fechaInicio: formData.fechaInicio.toISOString(),
          fechaFin: formData.fechaFin.toISOString(),
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
        };
        
        addProyecto(nuevoProyecto);
        toast.success("Proyecto creado correctamente");
      }
      
      onSuccess();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{proyectoId ? "Editar Proyecto" : "Nuevo Proyecto"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título del Proyecto *</Label>
            <Input
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ingrese el título del proyecto"
              className={errors.titulo ? "border-red-500" : ""}
            />
            {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Ingrese una descripción para el proyecto"
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.fechaInicio ? "border-red-500" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.fechaInicio, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fechaInicio}
                    onSelect={handleFechaInicioChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaInicio && <p className="text-red-500 text-sm">{errors.fechaInicio}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha de Fin *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.fechaFin ? "border-red-500" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.fechaFin, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fechaFin}
                    onSelect={handleFechaFinChange}
                    initialFocus
                    disabled={(date) => date < formData.fechaInicio}
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaFin && <p className="text-red-500 text-sm">{errors.fechaFin}</p>}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : proyectoId ? "Actualizar Proyecto" : "Crear Proyecto"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProyectoForm;
