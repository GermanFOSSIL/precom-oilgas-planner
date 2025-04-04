
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
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ITR, ITRFormData, EstadoITR } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface ITRFormProps {
  itrId?: string;
  defaultProyectoId?: string;
  defaultActividadId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ITRForm: React.FC<ITRFormProps> = ({
  itrId,
  defaultProyectoId,
  defaultActividadId,
  onCancel,
  onSuccess,
}) => {
  const { proyectos, actividades, itrbItems, addITRB, updateITRB, validateFechasITR } = useAppContext();

  const [formData, setFormData] = useState<ITRFormData>({
    proyectoId: defaultProyectoId || "",
    actividadId: defaultActividadId,
    nombre: "",
    descripcion: "",
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setDate(new Date().getDate() + 7)),
    cantidadTotal: 1,
    cantidadRealizada: 0,
    estado: "Pendiente",
    mcc: false,
    codigoITR: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [actividadesProyecto, setActividadesProyecto] = useState<Array<{ id: string; nombre: string }>>([]);

  // Obtener actividades del proyecto seleccionado
  useEffect(() => {
    if (formData.proyectoId) {
      const actividadesDelProyecto = actividades
        .filter((a) => a.proyectoId === formData.proyectoId)
        .map((a) => ({ id: a.id, nombre: a.nombre }));
      setActividadesProyecto(actividadesDelProyecto);
    } else {
      setActividadesProyecto([]);
    }
  }, [formData.proyectoId, actividades]);

  // Si se proporciona un itrId, cargar los datos del ITR existente
  useEffect(() => {
    if (itrId) {
      const itr = itrbItems.find((i) => i.id === itrId);
      if (itr) {
        setFormData({
          proyectoId: itr.proyectoId,
          actividadId: itr.actividadId,
          nombre: itr.nombre,
          descripcion: itr.descripcion || "",
          fechaInicio: new Date(itr.fechaInicio),
          fechaFin: new Date(itr.fechaFin),
          cantidadTotal: itr.cantidadTotal,
          cantidadRealizada: itr.cantidadRealizada,
          estado: itr.estado,
          mcc: itr.mcc,
          observaciones: itr.observaciones,
          codigoITR: itr.codigoITR,
        });
      }
    }
  }, [itrId, itrbItems]);

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

  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const numberValue = parseInt(value);
    
    if (!isNaN(numberValue) && numberValue >= 0) {
      setFormData((prev) => ({ ...prev, [name]: numberValue }));
      
      // Limpiar errores
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, mcc: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.proyectoId) {
      newErrors.proyectoId = "Debes seleccionar un proyecto";
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }

    if (!validateFechasITR(formData.proyectoId, formData.fechaInicio, formData.fechaFin)) {
      newErrors.fechas = "Las fechas no son válidas o están fuera del rango del proyecto";
    }

    if (formData.cantidadTotal <= 0) {
      newErrors.cantidadTotal = "La cantidad total debe ser mayor a cero";
    }

    if (formData.cantidadRealizada > formData.cantidadTotal) {
      newErrors.cantidadRealizada = "La cantidad realizada no puede ser mayor a la total";
    }

    // Si está asociado a una actividad, validar fechas
    if (formData.actividadId) {
      const actividad = actividades.find((a) => a.id === formData.actividadId);
      if (actividad) {
        const actividadInicio = new Date(actividad.fechaInicio);
        const actividadFin = new Date(actividad.fechaFin);
        const itrbInicio = formData.fechaInicio;
        const itrbFin = formData.fechaFin;

        if (itrbInicio < actividadInicio || itrbFin > actividadFin) {
          newErrors.actividadId = "Las fechas del ITR deben estar dentro del rango de la actividad";
        }
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
      // Determinar el estado basado en las cantidades
      let estado: EstadoITR = formData.estado;
      if (formData.cantidadRealizada >= formData.cantidadTotal) {
        estado = "Completado";
      } else if (formData.cantidadRealizada === 0) {
        estado = "Pendiente";
      } else {
        estado = "En curso";
      }

      const itrData = {
        proyectoId: formData.proyectoId,
        actividadId: formData.actividadId,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin.toISOString(),
        cantidadTotal: formData.cantidadTotal,
        cantidadRealizada: formData.cantidadRealizada,
        estado,
        mcc: formData.mcc,
        observaciones: formData.observaciones,
        codigoITR: formData.codigoITR,
      };

      if (itrId) {
        // Actualizar ITR existente
        updateITRB(itrId, itrData);
        toast.success("ITR actualizado correctamente");
      } else {
        // Crear nuevo ITR
        const nuevoITR: ITR = {
          id: uuidv4(),
          ...itrData,
        };
        addITRB(nuevoITR);
        toast.success("ITR creado correctamente");
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

  // Calcular fechas límite según la actividad seleccionada (si hay)
  const actividadSeleccionada = formData.actividadId
    ? actividades.find((a) => a.id === formData.actividadId)
    : undefined;
  const fechaMinActividad = actividadSeleccionada
    ? new Date(actividadSeleccionada.fechaInicio)
    : undefined;
  const fechaMaxActividad = actividadSeleccionada
    ? new Date(actividadSeleccionada.fechaFin)
    : undefined;

  // Usar las fechas más restrictivas
  const fechaMin = fechaMinActividad && fechaMinProyecto
    ? new Date(Math.max(fechaMinActividad.getTime(), fechaMinProyecto.getTime()))
    : fechaMinActividad || fechaMinProyecto;
  const fechaMax = fechaMaxActividad && fechaMaxProyecto
    ? new Date(Math.min(fechaMaxActividad.getTime(), fechaMaxProyecto.getTime()))
    : fechaMaxActividad || fechaMaxProyecto;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {itrId ? "Editar ITR" : "Nuevo ITR"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proyectoId">Proyecto *</Label>
            <Select
              value={formData.proyectoId}
              onValueChange={(value) => handleSelectChange("proyectoId", value)}
              disabled={!!itrId} // No permitir cambiar el proyecto al editar
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
            <Label htmlFor="actividadId">Actividad (opcional)</Label>
            <Select
              value={formData.actividadId || ""}
              onValueChange={(value) => handleSelectChange("actividadId", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar actividad relacionada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin actividad relacionada</SelectItem>
                {actividadesProyecto.map((actividad) => (
                  <SelectItem key={actividad.id} value={actividad.id}>
                    {actividad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.actividadId && (
              <p className="text-red-500 text-sm">{errors.actividadId}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Seleccionar una actividad restringe el rango de fechas disponibles
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del ITR *</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ingrese el nombre del ITR"
              className={errors.nombre ? "border-red-500" : ""}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm">{errors.nombre}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="codigoITR">Código de ITR</Label>
            <Input
              id="codigoITR"
              name="codigoITR"
              value={formData.codigoITR || ""}
              onChange={handleInputChange}
              placeholder="Ingrese el código del ITR"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Ingrese una descripción para el ITR"
              rows={3}
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
                    disabled={(date) => {
                      // Deshabilitar fechas fuera del rango permitido
                      if (fechaMin && date < fechaMin) return true;
                      if (fechaMax && date > fechaMax) return true;
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
                      // Deshabilitar fechas fuera del rango permitido
                      if (fechaMax && date > fechaMax) return true;
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidadTotal">Cantidad Total *</Label>
              <Input
                id="cantidadTotal"
                name="cantidadTotal"
                type="number"
                min={1}
                value={formData.cantidadTotal}
                onChange={handleNumberInputChange}
                className={errors.cantidadTotal ? "border-red-500" : ""}
              />
              {errors.cantidadTotal && (
                <p className="text-red-500 text-sm">{errors.cantidadTotal}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidadRealizada">Cantidad Realizada</Label>
              <Input
                id="cantidadRealizada"
                name="cantidadRealizada"
                type="number"
                min={0}
                max={formData.cantidadTotal}
                value={formData.cantidadRealizada}
                onChange={handleNumberInputChange}
                className={errors.cantidadRealizada ? "border-red-500" : ""}
              />
              {errors.cantidadRealizada && (
                <p className="text-red-500 text-sm">{errors.cantidadRealizada}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => handleSelectChange("estado", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En curso">En curso</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="mcc"
              checked={formData.mcc}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="mcc">Requiere MCC (Manufacturing Completion Certificate)</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones || ""}
              onChange={handleInputChange}
              placeholder="Ingrese observaciones adicionales"
              rows={3}
            />
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
            {loading ? "Guardando..." : itrId ? "Actualizar ITR" : "Crear ITR"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ITRForm;
