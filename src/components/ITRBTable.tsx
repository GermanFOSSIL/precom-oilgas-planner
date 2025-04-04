import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  InfoIcon, 
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  Filter,
  CheckSquare,
  Square
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ITRB, EstadoITRB } from "@/types";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ITRBTable: React.FC = () => {
  const { 
    itrbItems, 
    updateITRB, 
    deleteITRB, 
    actividades, 
    proyectoActual, 
    filtros, 
    isAdmin,
    isTecnico
  } = useAppContext();

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoITRB | "todos">("todos");
  const [mccFiltro, setMccFiltro] = useState<boolean | "todos">("todos");
  
  const [sistemasFiltrados, setSistemasFiltrados] = useState<string[]>([]);
  const [subsistemasFiltrados, setSubsistemasFiltrados] = useState<string[]>([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState<string[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  
  const [itrbEditando, setItrbEditando] = useState<ITRB | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const sistemasDisponibles = useMemo(() => {
    const sistemas = new Set<string>();
    actividades.forEach(act => {
      if (proyectoActual === "todos" || act.proyectoId === proyectoActual) {
        sistemas.add(act.sistema || "sin-sistema");
      }
    });
    return Array.from(sistemas).sort();
  }, [actividades, proyectoActual]);

  const subsitemasDisponibles = useMemo(() => {
    const subsistemas = new Set<string>();
    actividades.forEach(act => {
      if ((proyectoActual === "todos" || act.proyectoId === proyectoActual) &&
          (sistemasFiltrados.length === 0 || sistemasFiltrados.includes(act.sistema || "sin-sistema"))) {
        subsistemas.add(act.subsistema || "sin-subsistema");
      }
    });
    return Array.from(subsistemas).sort();
  }, [actividades, proyectoActual, sistemasFiltrados]);

  const actividadesDisponibles = useMemo(() => {
    return actividades
      .filter(act => {
        if (proyectoActual !== "todos" && act.proyectoId !== proyectoActual) return false;
        if (sistemasFiltrados.length > 0 && !sistemasFiltrados.includes(act.sistema || "sin-sistema")) return false;
        if (subsistemasFiltrados.length > 0 && !subsistemasFiltrados.includes(act.subsistema || "sin-subsistema")) return false;
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [actividades, proyectoActual, sistemasFiltrados, subsistemasFiltrados]);

  const itrbFiltrados = useMemo(() => {
    return itrbItems.filter(itrb => {
      const actividad = actividades.find(act => act.id === itrb.actividadId);
      
      if (filtros.proyecto !== "todos" && proyectoActual !== "todos") {
        if (!actividad || actividad.proyectoId !== proyectoActual) {
          return false;
        }
      }
      
      if (sistemasFiltrados.length > 0) {
        if (!actividad || !sistemasFiltrados.includes(actividad.sistema || "sin-sistema")) {
          return false;
        }
      }
      
      if (subsistemasFiltrados.length > 0) {
        if (!actividad || !subsistemasFiltrados.includes(actividad.subsistema || "sin-subsistema")) {
          return false;
        }
      }
      
      if (actividadesFiltradas.length > 0) {
        if (!actividadesFiltradas.includes(itrb.actividadId)) {
          return false;
        }
      }
      
      if (estadoFiltro !== "todos" && itrb.estado !== estadoFiltro) {
        return false;
      }
      
      if (mccFiltro !== "todos" && itrb.mcc !== mccFiltro) {
        return false;
      }
      
      if (busqueda) {
        const busquedaMinuscula = busqueda.toLowerCase();
        const actividadNombre = actividad ? actividad.nombre.toLowerCase() : "";
        
        if (!itrb.descripcion.toLowerCase().includes(busquedaMinuscula) && 
            !actividadNombre.includes(busquedaMinuscula)) {
          return false;
        }
      }
      
      return true;
    });
  }, [itrbItems, actividades, proyectoActual, filtros, estadoFiltro, mccFiltro, busqueda, 
      sistemasFiltrados, subsistemasFiltrados, actividadesFiltradas]);

  const handleSistemaChange = (sistema: string, checked: boolean) => {
    if (checked) {
      setSistemasFiltrados([...sistemasFiltrados, sistema]);
    } else {
      setSistemasFiltrados(sistemasFiltrados.filter(s => s !== sistema));
      const subsistemasDeSistema = actividades
        .filter(act => act.sistema === sistema)
        .map(act => act.subsistema);
      
      setSubsistemasFiltrados(subsistemasFiltrados.filter(s => !subsistemasDeSistema.includes(s)));
      
      const actividadesDelSistema = actividades
        .filter(act => act.sistema === sistema)
        .map(act => act.id);
      
      setActividadesFiltradas(actividadesFiltradas.filter(a => !actividadesDelSistema.includes(a)));
    }
  };

  const handleSubsistemaChange = (subsistema: string, checked: boolean) => {
    if (checked) {
      setSubsistemasFiltrados([...subsistemasFiltrados, subsistema]);
    } else {
      setSubsistemasFiltrados(subsistemasFiltrados.filter(s => s !== subsistema));
      
      const actividadesDelSubsistema = actividades
        .filter(act => act.subsistema === subsistema)
        .map(act => act.id);
      
      setActividadesFiltradas(actividadesFiltradas.filter(a => !actividadesDelSubsistema.includes(a)));
    }
  };

  const handleActividadChange = (actividadId: string, checked: boolean) => {
    if (checked) {
      setActividadesFiltradas([...actividadesFiltradas, actividadId]);
    } else {
      setActividadesFiltradas(actividadesFiltradas.filter(a => a !== actividadId));
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("todos");
    setMccFiltro("todos");
    setSistemasFiltrados([]);
    setSubsistemasFiltrados([]);
    setActividadesFiltradas([]);
  };

  const handleEdit = (itrb: ITRB) => {
    const itrb_processed = {
      ...itrb,
      fechaInicio: itrb.fechaInicio ? new Date(itrb.fechaInicio).toISOString() : new Date().toISOString(),
      fechaLimite: itrb.fechaLimite ? new Date(itrb.fechaLimite).toISOString() : (() => {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        return defaultDate.toISOString();
      })()
    };
    
    setItrbEditando(itrb_processed);
    setShowEditDialog(true);
  };

  const handleSaveChanges = () => {
    if (itrbEditando) {
      if (!itrbEditando.descripcion.trim() || !itrbEditando.actividadId) {
        toast.error("La descripción y la actividad son obligatorias");
        return;
      }
      
      try {
        const fechaInicio = new Date(itrbEditando.fechaInicio);
        const fechaLimite = new Date(itrbEditando.fechaLimite);
        
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaLimite.getTime())) {
          toast.error("Las fechas ingresadas no son válidas");
          return;
        }
      } catch (error) {
        toast.error("Error al procesar las fechas");
        return;
      }
      
      let estado: EstadoITRB = itrbEditando.estado;
      
      if (itrbEditando.cantidadRealizada >= itrbEditando.cantidadTotal) {
        estado = "Completado";
      } else if (new Date(itrbEditando.fechaLimite) < new Date()) {
        estado = "Vencido";
      } else {
        estado = "En curso";
      }
      
      const itrbActualizado = {
        ...itrbEditando,
        estado
      };
      
      updateITRB(itrbActualizado.id, itrbActualizado);
      setShowEditDialog(false);
      toast.success("ITR B actualizado exitosamente", {
        description: "Los cambios se han guardado correctamente."
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteITRB(id);
    toast.success("ITR B eliminado exitosamente");
  };

  const getProgreso = (itrb: ITRB) => {
    return (itrb.cantidadRealizada / itrb.cantidadTotal) * 100;
  };

  const renderEstadoIcon = (estado: EstadoITRB) => {
    switch (estado) {
      case "Completado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Vencido":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "En curso":
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleCantidadRealizadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (itrbEditando) {
      const cantidad = parseInt(e.target.value);
      if (!isNaN(cantidad) && cantidad >= 0 && cantidad <= itrbEditando.cantidadTotal) {
        setItrbEditando({
          ...itrbEditando,
          cantidadRealizada: cantidad
        });
      }
    }
  };

  const handleFechaLimiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (itrbEditando) {
      try {
        const fechaStr = e.target.value;
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime())) {
          setItrbEditando({
            ...itrbEditando,
            fechaLimite: fecha.toISOString()
          });
        }
      } catch (error) {
        console.error("Error al procesar la fecha:", error);
      }
    }
  };

  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (itrbEditando) {
      try {
        const fechaStr = e.target.value;
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime())) {
          setItrbEditando({
            ...itrbEditando,
            fechaInicio: fecha.toISOString()
          });
        }
      } catch (error) {
        console.error("Error al procesar la fecha:", error);
      }
    }
  };

  const formatFechaForDateInput = (fechaIso: string): string => {
    try {
      const fecha = new Date(fechaIso);
      if (!isNaN(fecha.getTime())) {
        return fecha.toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return new Date().toISOString().split('T')[0];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">ITR B</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="ml-2">
            Total: {itrbFiltrados.length}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por descripción o actividad..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <Select
          value={estadoFiltro}
          onValueChange={(value: EstadoITRB | "todos") => setEstadoFiltro(value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="Completado">Completado</SelectItem>
            <SelectItem value="En curso">En curso</SelectItem>
            <SelectItem value="Vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={mccFiltro === "todos" ? "todos" : String(mccFiltro)}
          onValueChange={(value) => setMccFiltro(value === "todos" ? "todos" : value === "true")}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="MCC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="true">MCC</SelectItem>
            <SelectItem value="false">No MCC</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
          <PopoverTrigger asChild>
            <Button 
              variant={sistemasFiltrados.length > 0 || subsistemasFiltrados.length > 0 || actividadesFiltradas.length > 0 
                ? "default" 
                : "outline"
              }
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros avanzados
              {(sistemasFiltrados.length > 0 || subsistemasFiltrados.length > 0 || actividadesFiltradas.length > 0) && (
                <Badge variant="secondary" className="ml-1">
                  {sistemasFiltrados.length + subsistemasFiltrados.length + actividadesFiltradas.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-[80vh] overflow-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filtros avanzados</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={limpiarFiltros}
                  className="text-xs"
                >
                  Limpiar todos
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Sistemas</Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {sistemasDisponibles.map(sistema => (
                    <div key={sistema} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`sistema-${sistema}`}
                        checked={sistemasFiltrados.includes(sistema)}
                        onCheckedChange={(checked) => 
                          handleSistemaChange(sistema, checked === true)
                        }
                      />
                      <Label 
                        htmlFor={`sistema-${sistema}`}
                        className="text-sm"
                      >
                        {sistema}
                      </Label>
                    </div>
                  ))}
                  {sistemasDisponibles.length === 0 && (
                    <p className="text-sm text-muted-foreground p-1">No hay sistemas disponibles</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Subsistemas</Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {subsitemasDisponibles.map(subsistema => (
                    <div key={subsistema} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`subsistema-${subsistema}`}
                        checked={subsistemasFiltrados.includes(subsistema)}
                        onCheckedChange={(checked) => 
                          handleSubsistemaChange(subsistema, checked === true)
                        }
                      />
                      <Label 
                        htmlFor={`subsistema-${subsistema}`}
                        className="text-sm"
                      >
                        {subsistema}
                      </Label>
                    </div>
                  ))}
                  {subsitemasDisponibles.length === 0 && (
                    <p className="text-sm text-muted-foreground p-1">
                      {sistemasFiltrados.length > 0 
                        ? "No hay subsistemas para los sistemas seleccionados" 
                        : "Seleccione al menos un sistema"
                      }
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Actividades</Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {actividadesDisponibles.map(actividad => (
                    <div key={actividad.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`actividad-${actividad.id}`}
                        checked={actividadesFiltradas.includes(actividad.id)}
                        onCheckedChange={(checked) => 
                          handleActividadChange(actividad.id, checked === true)
                        }
                      />
                      <Label 
                        htmlFor={`actividad-${actividad.id}`}
                        className="text-sm"
                      >
                        {actividad.nombre}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({actividad.sistema} / {actividad.subsistema})
                        </span>
                      </Label>
                    </div>
                  ))}
                  {actividadesDisponibles.length === 0 && (
                    <p className="text-sm text-muted-foreground p-1">
                      {sistemasFiltrados.length > 0 || subsistemasFiltrados.length > 0 
                        ? "No hay actividades para los filtros seleccionados" 
                        : "Seleccione al menos un sistema o subsistema"
                      }
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => setShowFilterPopover(false)}
                  className="w-full"
                >
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          variant="outline"
          size="icon"
          onClick={limpiarFiltros}
          className="shrink-0"
          title="Limpiar todos los filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Actividad</TableHead>
              <TableHead className="w-[120px]">Progreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>MCC</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itrbFiltrados.length > 0 ? (
              itrbFiltrados.map((itrb) => {
                const actividad = actividades.find(act => act.id === itrb.actividadId);
                const progreso = getProgreso(itrb);
                
                return (
                  <TableRow key={itrb.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell className="font-medium">{itrb.id.substring(0, 8)}...</TableCell>
                    <TableCell>{itrb.descripcion}</TableCell>
                    <TableCell>
                      {actividad ? (
                        <div>
                          <div>{actividad.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {actividad.sistema} / {actividad.subsistema}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={progreso} className="h-2" />
                        <span className="text-xs">
                          {itrb.cantidadRealizada}/{itrb.cantidadTotal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {renderEstadoIcon(itrb.estado)}
                        <span className={
                          itrb.estado === "Completado" ? "text-green-600" :
                          itrb.estado === "Vencido" ? "text-red-600" :
                          "text-blue-600"
                        }>
                          {itrb.estado}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {itrb.mcc ? (
                        <Badge variant="default" className="bg-blue-500">MCC</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(itrb.fechaLimite).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {(isAdmin || isTecnico) && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEdit(itrb)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar ITR B</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará permanentemente el ITR B "{itrb.descripcion}".
                                          Esta acción no puede deshacerse.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDelete(itrb.id)}
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar ITR B</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                  No hay ITR B disponibles para los filtros seleccionados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar ITR B</DialogTitle>
            <DialogDescription>
              Modifique los datos del ITR B
            </DialogDescription>
          </DialogHeader>
          
          {itrbEditando && (
            <div className="grid gap-4 py-3">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="actividad">Actividad Asociada *</Label>
                <Select 
                  value={itrbEditando.actividadId}
                  onValueChange={(value) => setItrbEditando({
                    ...itrbEditando,
                    actividadId: value
                  })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    {actividades
                      .filter(act => proyectoActual === "todos" || act.proyectoId === proyectoActual)
                      .map(actividad => (
                        <SelectItem key={actividad.id} value={actividad.id}>
                          {actividad.nombre} ({actividad.sistema || "Sin sistema"} - {actividad.subsistema || "Sin subsistema"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input 
                  id="descripcion"
                  value={itrbEditando.descripcion}
                  onChange={(e) => setItrbEditando({
                    ...itrbEditando,
                    descripcion: e.target.value
                  })}
                  placeholder="Descripción del ITR B"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidadTotal">Cantidad Total</Label>
                  <Input 
                    id="cantidadTotal"
                    type="number"
                    value={itrbEditando.cantidadTotal}
                    onChange={(e) => {
                      const total = parseInt(e.target.value);
                      if (!isNaN(total) && total > 0) {
                        setItrbEditando({
                          ...itrbEditando,
                          cantidadTotal: total,
                          cantidadRealizada: Math.min(itrbEditando.cantidadRealizada, total)
                        });
                      }
                    }}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidadRealizada">Cantidad Realizada</Label>
                  <Input 
                    id="cantidadRealizada"
                    type="number"
                    value={itrbEditando.cantidadRealizada}
                    onChange={handleCantidadRealizadaChange}
                    min={0}
                    max={itrbEditando.cantidadTotal}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input 
                    id="fechaInicio"
                    type="date"
                    value={formatFechaForDateInput(itrbEditando.fechaInicio)}
                    onChange={handleFechaInicioChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaLimite">Fecha Límite</Label>
                  <Input 
                    id="fechaLimite"
                    type="date"
                    value={formatFechaForDateInput(itrbEditando.fechaLimite)}
                    onChange={handleFechaLimiteChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center pt-4">
                <Checkbox
                  id="mcc"
                  checked={itrbEditando.mcc}
                  onCheckedChange={(checked) => setItrbEditando({
                    ...itrbEditando,
                    mcc: checked === true
                  })}
                />
                <Label htmlFor="mcc" className="ml-2">
                  Marcar como MCC
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea 
                  id="observaciones"
                  value={itrbEditando.observaciones || ""}
                  onChange={(e) => setItrbEditando({
                    ...itrbEditando,
                    observaciones: e.target.value
                  })}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITRBTable;
