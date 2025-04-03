import React, { useState } from "react";
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
  Plus
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
  
  // Estado para la edición
  const [itrbEditando, setItrbEditando] = useState<ITRB | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Obtener los ITRB filtrados
  const itrbFiltrados = React.useMemo(() => {
    return itrbItems.filter(itrb => {
      // Encontrar la actividad a la que pertenece el ITRB
      const actividad = actividades.find(act => act.id === itrb.actividadId);
      
      // Filtrar por proyecto
      if (filtros.proyecto !== "todos" && proyectoActual !== "todos") {
        if (!actividad || actividad.proyectoId !== proyectoActual) {
          return false;
        }
      }
      
      // Filtrar por sistema
      if (filtros.sistema && filtros.sistema !== "todos") {
        if (!actividad || actividad.sistema !== filtros.sistema) {
          return false;
        }
      }
      
      // Filtrar por subsistema
      if (filtros.subsistema && filtros.subsistema !== "todos") {
        if (!actividad || actividad.subsistema !== filtros.subsistema) {
          return false;
        }
      }
      
      // Filtrar por estado de ITRB
      if (estadoFiltro !== "todos" && itrb.estado !== estadoFiltro) {
        return false;
      }
      
      // Filtrar por MCC
      if (mccFiltro !== "todos" && itrb.mcc !== mccFiltro) {
        return false;
      }
      
      // Filtrar por búsqueda en descripción o actividad
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
  }, [itrbItems, actividades, proyectoActual, filtros, estadoFiltro, mccFiltro, busqueda]);

  // Función para abrir el diálogo de edición
  const handleEdit = (itrb: ITRB) => {
    setItrbEditando({...itrb});
    setShowEditDialog(true);
  };

  // Función para guardar los cambios
  const handleSaveChanges = () => {
    if (itrbEditando) {
      if (!itrbEditando.descripcion.trim() || !itrbEditando.actividadId) {
        toast.error("La descripción y la actividad son obligatorias");
        return;
      }
      
      // Actualizar el estado si es necesario
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

  // Función para confirmar eliminación
  const handleDelete = (id: string) => {
    deleteITRB(id);
    toast.success("ITR B eliminado exitosamente");
  };

  // Obtener el porcentaje de progreso
  const getProgreso = (itrb: ITRB) => {
    return (itrb.cantidadRealizada / itrb.cantidadTotal) * 100;
  };

  // Renderizar icono de estado
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

  // Función para cambiar la cantidad realizada
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

  // Función para cambiar la fecha límite
  const handleFechaLimiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (itrbEditando) {
      const fechaLimite = e.target.value;
      setItrbEditando({
        ...itrbEditando,
        fechaLimite: new Date(fechaLimite).toISOString()
      });
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
          value={mccFiltro.toString()}
          onValueChange={(value) => setMccFiltro(value === "true" ? true : value === "false" ? false : "todos")}
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

      {/* Diálogo de edición */}
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
                          {actividad.nombre} ({actividad.sistema} - {actividad.subsistema})
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
                  <Label htmlFor="fechaLimite">Fecha Límite</Label>
                  <Input 
                    id="fechaLimite"
                    type="date"
                    value={new Date(itrbEditando.fechaLimite).toISOString().split('T')[0]}
                    onChange={handleFechaLimiteChange}
                  />
                </div>
                <div className="flex items-center pt-8">
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
