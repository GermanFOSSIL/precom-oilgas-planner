
import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Actividad, ITR, EstadoITR } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Calendar, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface ITRFormRelationshipProps {
  onClose: () => void;
  editingITR?: ITR;
}

const ITRFormRelationship: React.FC<ITRFormRelationshipProps> = ({ onClose, editingITR }) => {
  const { actividades, proyectos, proyectoActual, addITRB, updateITRB } = useAppContext();

  const initialData: Omit<ITR, "id" | "estado"> = {
    proyectoId: editingITR?.proyectoId || (proyectoActual !== "todos" ? proyectoActual : ""),
    actividadId: editingITR?.actividadId || "",
    nombre: editingITR?.nombre || "",
    descripcion: editingITR?.descripcion || "",
    cantidadTotal: editingITR?.cantidadTotal || 1,
    cantidadRealizada: editingITR?.cantidadRealizada || 0,
    fechaInicio: editingITR?.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: editingITR?.fechaFin || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mcc: editingITR?.mcc || false,
    observaciones: editingITR?.observaciones || "",
    codigoITR: editingITR?.codigoITR || ""
  };

  const [formData, setFormData] = useState<typeof initialData>(initialData);
  const [selectedProyecto, setSelectedProyecto] = useState<string>(
    formData.proyectoId || (proyectoActual !== "todos" ? proyectoActual : "")
  );
  const [selectedSistema, setSelectedSistema] = useState<string>("");
  const [selectedSubsistema, setSelectedSubsistema] = useState<string>("");
  const [busquedaActividad, setBusquedaActividad] = useState<string>("");
  const [calendarStartOpen, setCalendarStartOpen] = useState(false);
  const [calendarEndOpen, setCalendarEndOpen] = useState(false);

  const proyectosDisponibles = useMemo(() => {
    return proyectos.map(p => ({
      id: p.id,
      nombre: p.titulo
    }));
  }, [proyectos]);

  const sistemasDisponibles = useMemo(() => {
    const sistemasSet = new Set<string>();
    
    actividades.forEach(act => {
      if (!selectedProyecto || act.proyectoId === selectedProyecto) {
        sistemasSet.add(act.sistema);
      }
    });
    
    return Array.from(sistemasSet).sort();
  }, [actividades, selectedProyecto]);

  const subsistemasDisponibles = useMemo(() => {
    const subsisSet = new Set<string>();
    
    actividades.forEach(act => {
      if (
        (!selectedProyecto || act.proyectoId === selectedProyecto) &&
        (!selectedSistema || act.sistema === selectedSistema)
      ) {
        subsisSet.add(act.subsistema);
      }
    });
    
    return Array.from(subsisSet).sort();
  }, [actividades, selectedProyecto, selectedSistema]);

  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(act => 
      (!selectedProyecto || act.proyectoId === selectedProyecto) &&
      (!selectedSistema || act.sistema === selectedSistema) &&
      (!selectedSubsistema || act.subsistema === selectedSubsistema) &&
      (!busquedaActividad || act.nombre.toLowerCase().includes(busquedaActividad.toLowerCase()))
    ).map(act => {
      const proyecto = proyectos.find(p => p.id === act.proyectoId);
      return {
        id: act.id,
        nombre: act.nombre,
        sistema: act.sistema,
        subsistema: act.subsistema,
        proyecto: proyecto?.titulo || "Sin proyecto"
      };
    });
  }, [actividades, proyectos, selectedProyecto, selectedSistema, selectedSubsistema, busquedaActividad]);

  const actividadSeleccionada = useMemo(() => {
    if (!formData.actividadId) return null;
    return actividades.find(act => act.id === formData.actividadId);
  }, [actividades, formData.actividadId]);

  const proyectoSeleccionado = useMemo(() => {
    if (!formData.proyectoId) return null;
    return proyectos.find(p => p.id === formData.proyectoId);
  }, [proyectos, formData.proyectoId]);

  // Fecha mínima y máxima según actividad y proyecto
  const minDate = useMemo(() => {
    let minDate: Date | undefined;
    
    if (proyectoSeleccionado) {
      minDate = new Date(proyectoSeleccionado.fechaInicio);
    }
    
    if (actividadSeleccionada) {
      const actDate = new Date(actividadSeleccionada.fechaInicio);
      if (!minDate || actDate > minDate) {
        minDate = actDate;
      }
    }
    
    return minDate || new Date();
  }, [proyectoSeleccionado, actividadSeleccionada]);
  
  const maxDate = useMemo(() => {
    let maxDate: Date | undefined;
    
    if (proyectoSeleccionado) {
      maxDate = new Date(proyectoSeleccionado.fechaFin);
    }
    
    if (actividadSeleccionada) {
      const actDate = new Date(actividadSeleccionada.fechaFin);
      if (!maxDate || actDate < maxDate) {
        maxDate = actDate;
      }
    }
    
    return maxDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }, [proyectoSeleccionado, actividadSeleccionada]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Math.max(0, parseInt(value) || 0);
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, mcc: checked }));
  };

  const handleSelectActividad = (actividadId: string) => {
    const actividad = actividades.find(act => act.id === actividadId);
    if (actividad) {
      setSelectedProyecto(actividad.proyectoId);
      setSelectedSistema(actividad.sistema);
      setSelectedSubsistema(actividad.subsistema);
      
      // Update form data with selected actividad and its proyectoId
      setFormData(prev => ({ 
        ...prev, 
        actividadId,
        proyectoId: actividad.proyectoId
      }));
    }
  };

  const handleSelectProyecto = (proyectoId: string) => {
    setSelectedProyecto(proyectoId);
    setFormData(prev => ({ ...prev, proyectoId }));
    
    // If the selected activity doesn't belong to this project, clear it
    if (formData.actividadId) {
      const actividad = actividades.find(a => a.id === formData.actividadId);
      if (actividad && actividad.proyectoId !== proyectoId) {
        setFormData(prev => ({ ...prev, actividadId: "" }));
      }
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, fechaInicio: dateStr }));
      setCalendarStartOpen(false);
      
      // Ensure end date is not before start date
      const currentEndDate = new Date(formData.fechaFin);
      if (date > currentEndDate) {
        setFormData(prev => ({ ...prev, fechaFin: dateStr }));
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        fechaFin: date.toISOString().split('T')[0] 
      }));
      setCalendarEndOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.proyectoId) {
      toast.error("Debe seleccionar un proyecto");
      return;
    }
    
    if (!formData.nombre) {
      toast.error("El nombre del ITR es obligatorio");
      return;
    }
    
    if (formData.cantidadTotal <= 0) {
      toast.error("La cantidad total debe ser mayor a cero");
      return;
    }
    
    if (formData.cantidadRealizada > formData.cantidadTotal) {
      toast.error("La cantidad realizada no puede ser mayor a la cantidad total");
      return;
    }
    
    // Validate dates
    const startDate = new Date(formData.fechaInicio);
    const endDate = new Date(formData.fechaFin);
    
    if (startDate > endDate) {
      toast.error("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }
    
    // Check if dates are within project dates
    if (proyectoSeleccionado) {
      const proyectoInicio = new Date(proyectoSeleccionado.fechaInicio);
      const proyectoFin = new Date(proyectoSeleccionado.fechaFin);
      
      if (startDate < proyectoInicio || endDate > proyectoFin) {
        toast.error("Las fechas del ITR deben estar dentro del rango del proyecto");
        return;
      }
    }
    
    // Check if dates are within activity dates if an activity is selected
    if (actividadSeleccionada) {
      const actividadInicio = new Date(actividadSeleccionada.fechaInicio);
      const actividadFin = new Date(actividadSeleccionada.fechaFin);
      
      if (startDate < actividadInicio || endDate > actividadFin) {
        toast.error("Las fechas del ITR deben estar dentro del rango de la actividad");
        return;
      }
    }

    try {
      // Determine estado based on cantidades
      let estado: EstadoITR = "En curso";
      if (formData.cantidadRealizada >= formData.cantidadTotal) {
        estado = "Completado";
      } else if (formData.cantidadRealizada === 0) {
        estado = "Pendiente";
      }
      
      // Check if end date has passed
      const now = new Date();
      if (endDate < now && formData.cantidadRealizada < formData.cantidadTotal) {
        estado = "Vencido";
      }
      
      if (editingITR) {
        const itr: ITR = {
          id: editingITR.id,
          ...formData,
          estado: editingITR.estado || estado
        };
        updateITRB(editingITR.id, itr);
        toast.success("ITR actualizado correctamente");
      } else {
        const itr: ITR = {
          id: `itr-${Date.now()}`,
          ...formData,
          estado
        };
        addITRB(itr);
        toast.success("ITR creado correctamente");
      }
      
      onClose();
    } catch (error) {
      console.error("Error al procesar ITR:", error);
      toast.error("Ocurrió un error al procesar el ITR");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proyecto">Proyecto *</Label>
          <Select
            value={formData.proyectoId}
            onValueChange={handleSelectProyecto}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              {proyectosDisponibles.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sistema">Sistema</Label>
            <Select
              value={selectedSistema}
              onValueChange={setSelectedSistema}
              disabled={sistemasDisponibles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sistemas</SelectItem>
                {sistemasDisponibles.map(sistema => (
                  <SelectItem key={sistema} value={sistema || "sin-sistema"}>
                    {sistema || "Sin sistema"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subsistema">Subsistema</Label>
            <Select
              value={selectedSubsistema}
              onValueChange={setSelectedSubsistema}
              disabled={subsistemasDisponibles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar subsistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los subsistemas</SelectItem>
                {subsistemasDisponibles.map(sub => (
                  <SelectItem key={sub} value={sub || "sin-subsistema"}>
                    {sub || "Sin subsistema"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="busqueda">Buscar actividad</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="busqueda"
              placeholder="Nombre de actividad..."
              className="pl-8"
              value={busquedaActividad}
              onChange={(e) => setBusquedaActividad(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actividad">Actividad Asociada (opcional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {actividadSeleccionada ? (
                  <span className="truncate">
                    {actividadSeleccionada.nombre} ({actividadSeleccionada.sistema}: {actividadSeleccionada.subsistema})
                  </span>
                ) : (
                  <span className="text-muted-foreground">Seleccionar actividad</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[500px]">
              <Command>
                <CommandInput placeholder="Buscar actividad..." value={busquedaActividad} onValueChange={setBusquedaActividad} />
                <CommandList>
                  <CommandEmpty>No se encontraron actividades</CommandEmpty>
                  <CommandGroup heading="Actividades disponibles">
                    {actividadesFiltradas.map((act) => (
                      <CommandItem
                        key={act.id}
                        value={act.id}
                        onSelect={() => handleSelectActividad(act.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.actividadId === act.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{act.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {act.sistema}: {act.subsistema} | {act.proyecto}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del ITR *</Label>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Nombre del ITR..."
            value={formData.nombre}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción del ITR</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            placeholder="Describe el ITR..."
            value={formData.descripcion}
            onChange={handleInputChange}
            className="resize-none"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cantidadTotal">Cantidad Total *</Label>
            <Input
              id="cantidadTotal"
              name="cantidadTotal"
              type="number"
              min={1}
              value={formData.cantidadTotal}
              onChange={handleNumericChange}
            />
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
              onChange={handleNumericChange}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
            <Popover open={calendarStartOpen} onOpenChange={setCalendarStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-left font-normal"
                >
                  {formData.fechaInicio ? (
                    format(new Date(formData.fechaInicio), "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  locale={es}
                  selected={formData.fechaInicio ? new Date(formData.fechaInicio) : undefined}
                  onSelect={handleStartDateSelect}
                  initialFocus
                  disabled={(date) => {
                    return date < minDate || date > maxDate;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha Fin *</Label>
            <Popover open={calendarEndOpen} onOpenChange={setCalendarEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-left font-normal"
                >
                  {formData.fechaFin ? (
                    format(new Date(formData.fechaFin), "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  locale={es}
                  selected={formData.fechaFin ? new Date(formData.fechaFin) : undefined}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  disabled={(date) => {
                    const startDate = new Date(formData.fechaInicio);
                    return date < startDate || date > maxDate;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="codigoITR">Código ITR</Label>
          <Input
            id="codigoITR"
            name="codigoITR"
            placeholder="Código de referencia..."
            value={formData.codigoITR || ""}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="mcc"
            checked={formData.mcc}
            onCheckedChange={handleCheckboxChange}
          />
          <Label htmlFor="mcc" className="cursor-pointer">
            Certificado de Conformidad de Construcción (MCC)
          </Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            name="observaciones"
            placeholder="Observaciones adicionales..."
            value={formData.observaciones}
            onChange={handleInputChange}
            className="resize-none"
            rows={2}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <FormSubmitButton onClick={handleSubmit} onComplete={onClose}>
          {editingITR ? "Actualizar ITR" : "Crear ITR"}
        </FormSubmitButton>
      </div>
    </div>
  );
};

export default ITRFormRelationship;
