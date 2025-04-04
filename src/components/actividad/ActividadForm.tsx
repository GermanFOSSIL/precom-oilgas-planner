
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Actividad, ActividadFormData } from "@/types";
import { v4 as uuidv4 } from "uuid";
import MultiSelect from "../ui/multi-select"; // Crearemos este componente después

interface ActividadFormProps {
  actividadId?: string;
  defaultProyectoId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ActividadForm: React.FC<ActividadFormProps> = ({
  actividadId,
  defaultProyectoId,
  onCancel,
  onSuccess,
}) => {
  const {
    proyectos,
    actividades,
    addActividad,
    updateActividad,
    validateFechasActividad,
  } = useAppContext();

  const [formData, setFormData] = useState<ActividadFormData>({
    proyectoId: defaultProyectoId || "",
    nombre: "",
    descripcion: "",
    sistema: "",
    subsistema: "",
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setDate(new Date().getDate() + 14)),
    dependencias: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [sistemasDisponibles, setSistemasDisponibles] = useState<string[]>([]);
  const [subsistemasFiltrados, setSubsistemasFiltrados] = useState<string[]>([]);
  const [actividadesProyecto, setActividadesProyecto] = useState<Actividad[]>([]);
  
  // Obtener sistemas y subsistemas únicos disponibles
  useEffect(() => {
    // Sistemas únicos
    const sistemas = Array.from(new Set(actividades.map((a) => a.sistema)))
      .filter(Boolean)
      .sort();
    setSistemasDisponibles(sistemas);

    // Actividades del proyecto seleccionado
    if (formData.proyectoId) {
      const actividadesDelProyecto = actividades.filter(
        (a) => a.proyectoId === formData.proyectoId && (!actividadId || a.id !== actividadId)
      );
      setActividadesProyecto(actividadesDelProyecto);
    } else {
      setActividadesProyecto([]);
    }
  }, [formData.proyectoId, actividades, actividadId]);

  // Filtrar subsistemas cuando cambia el sistema seleccionado
  useEffect(() => {
    if (formData.sistema) {
      const subsistemas = Array.from(
        new Set(
          actividades
            .filter((a) => a.sistema === formData.sistema)
            .map((a) => a.subsistema)
        )
      )
        .filter(Boolean)
        .sort();
      setSubsistemasFiltrados(subsistemas);
    } else {
      setSubsistemasFiltrados([]);
    }
  }, [formData.sistema, actividades]);

  // Si se proporciona un actividadId, cargar los datos de la actividad existente
  useEffect(() => {
    if (actividadId) {
      const actividad = actividades.find((a) => a.id === actividadId);
      if (actividad) {
        setFormData({
          proyectoId: actividad.proyectoId,
          nombre: actividad.nombre,
          descripcion: actividad.descripcion || "",
          sistema: actividad.sistema,
          subsistema: actividad.subsistema,
          fechaInicio: new Date(actividad.fechaInicio),
          fechaFin: new Date(actividad.fechaFin),
          dependencias: actividad.dependencias || [],
        });
      }
    }
  }, [actividadId, actividades]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar errores
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
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

  const handleDependenciasChange = (selectedIds: string[]) => {
    setFormData((prev) => ({ ...prev, dependencias: selectedIds }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.proyectoId) {
      newErrors.proyectoId = "Debes seleccionar un proyecto";
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }

    if (!formData.sistema.trim()) {
      newErrors.sistema = "El sistema es obligatorio";
    }

    if (!formData.subsistema.trim()) {
      newErrors.subsistema = "El subsistema es obligatorio";
    }

    if (!validateFechasActividad(formData.proyectoId, formData.fechaInicio, formData.fechaFin)) {
      newErrors.fechas = "Las fechas no son válidas o están fuera del rango del proyecto";
    }

    // Validar dependencias
    if (formData.dependencias && formData.dependencias.length > 0) {
      const actividadesDependientes = actividades.filter(
        (a) => formData.dependencias?.includes(a.id)
      );

      // Verificar que la fecha de inicio sea posterior a la fecha de fin de todas las dependencias
      const fechaInicio = formData.fechaInicio;
      const algunaDependenciaInvalida = actividadesDependientes.some((dep) => {
        const fechaFinDependencia = new Date(dep.fechaFin);
        return isAfter(fechaFinDependencia, fechaInicio);
      });

      if (algunaDependenciaInvalida) {
        newErrors.dependencias =
          "La fecha de inicio debe ser posterior a la fecha de fin de todas las dependencias";
      }
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
      const actividadData = {
        proyectoId: formData.proyectoId,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        sistema: formData.sistema,
        subsistema: formData.subsistema,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin.toISOString(),
        duracion: Math.ceil(
          (formData.fechaFin.getTime() - formData.fechaInicio.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        dependencias: formData.dependencias,
      };

      if (actividadId) {
        // Actualizar actividad existente
        updateActividad(actividadId, actividadData);
        toast.success("Actividad actualizada correctamente");
      } else {
        // Crear nueva actividad
        const nuevaActividad: Actividad = {
          id: uuidv4(),
          ...actividadData,
        };
        addActividad(nuevaActividad);
        toast.success("Actividad creada correctamente");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular fechas límite según el proyecto seleccionado
  const proyectoSeleccionado = proyectos.find((p) => p.id === formData.proyectoId);
  const fechaMinProyecto = proyectoSeleccionado
    ? new Date(proyectoSeleccionado.fechaInicio)
    : undefined;
  const fechaMaxProyecto = proyectoSeleccionado
    ? new Date(proyectoSeleccionado.fechaFin)
    : undefined;

  // Opciones para MultiSelect
  const opcionesDependencias = actividadesProyecto.map((a) => ({
    value: a.id,
    label: a.nombre,
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {actividadId ? "Editar Actividad" : "Nueva Actividad"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proyectoId">Proyecto *</Label>
            <Select
              value={formData.proyectoId}
              onValueChange={(value) => handleSelectChange("proyectoId", value)}
              disabled={!!actividadId} // No permitir cambiar el proyecto al editar
            >
              <SelectTrigger
                className={errors.proyectoId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {proyectos.map((proyecto) => (
                  <SelectItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.proyectoId && (
              <p className="text-red-500 text-sm">{errors.proyectoId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Actividad *</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ingrese el nombre de la actividad"
              className={errors.nombre ? "border-red-500" : ""}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Ingrese una descripción para la actividad"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sistema">Sistema *</Label>
              <Select
                value={formData.sistema}
                onValueChange={(value) => handleSelectChange("sistema", value)}
              >
                <SelectTrigger
                  className={errors.sistema ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Seleccionar sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemasDisponibles.length > 0 ? (
                    sistemasDisponibles.map((sistema) => (
                      <SelectItem key={sistema} value={sistema}>
                        {sistema}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="nuevo">Nuevo Sistema</SelectItem>
                  )}
                  <SelectItem value="otro">Otro...</SelectItem>
                </SelectContent>
              </Select>
              {formData.sistema === "otro" && (
                <Input
                  name="sistema"
                  value={formData.sistema === "otro" ? "" : formData.sistema}
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre del sistema"
                  className="mt-2"
                />
              )}
              {errors.sistema && (
                <p className="text-red-500 text-sm">{errors.sistema}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subsistema">Subsistema *</Label>
              <Select
                value={formData.subsistema}
                onValueChange={(value) =>
                  handleSelectChange("subsistema", value)
                }
              >
                <SelectTrigger
                  className={errors.subsistema ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Seleccionar subsistema" />
                </SelectTrigger>
                <SelectContent>
                  {subsistemasFiltrados.length > 0 ? (
                    subsistemasFiltrados.map((subsistema) => (
                      <SelectItem key={subsistema} value={subsistema}>
                        {subsistema}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="nuevo">Nuevo Subsistema</SelectItem>
                  )}
                  <SelectItem value="otro">Otro...</SelectItem>
                </SelectContent>
              </Select>
              {formData.subsistema === "otro" && (
                <Input
                  name="subsistema"
                  value={
                    formData.subsistema === "otro" ? "" : formData.subsistema
                  }
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre del subsistema"
                  className="mt-2"
                />
              )}
              {errors.subsistema && (
                <p className="text-red-500 text-sm">{errors.subsistema}</p>
              )}
            </div>
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
                    disabled={(date) => {
                      // Deshabilitar fechas fuera del rango del proyecto
                      if (fechaMinProyecto && date < fechaMinProyecto) return true;
                      if (fechaMaxProyecto && date > fechaMaxProyecto) return true;
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaInicio && (
                <p className="text-red-500 text-sm">{errors.fechaInicio}</p>
              )}
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
                    disabled={(date) => {
                      // Deshabilitar fechas anteriores a la fecha de inicio
                      if (date < formData.fechaInicio) return true;
                      // Deshabilitar fechas fuera del rango del proyecto
                      if (fechaMaxProyecto && date > fechaMaxProyecto) return true;
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaFin && (
                <p className="text-red-500 text-sm">{errors.fechaFin}</p>
              )}
            </div>
          </div>

          {errors.fechas && (
            <p className="text-red-500 text-sm">{errors.fechas}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="dependencias">Dependencias (opcional)</Label>
            <MultiSelect
              options={opcionesDependencias}
              selected={formData.dependencias || []}
              onChange={handleDependenciasChange}
              placeholder="Seleccionar actividades dependientes"
            />
            {errors.dependencias && (
              <p className="text-red-500 text-sm">{errors.dependencias}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Selecciona actividades que deben completarse antes de iniciar esta
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : actividadId ? "Actualizar Actividad" : "Crear Actividad"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ActividadForm;
