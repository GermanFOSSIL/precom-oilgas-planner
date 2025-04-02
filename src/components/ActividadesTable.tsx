
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
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus, 
  Download,
  Filter,
  Calendar,
  CalendarRange,
  Search,
  SortAsc,
  SortDesc,
  List,
  Save,
  X,
  AlertCircle
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Actividad } from "@/types";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

// Tipo para el estado de ordenamiento
type SortField = 'nombre' | 'sistema' | 'subsistema' | 'fechaInicio' | 'fechaFin' | 'duracion';
type SortDirection = 'asc' | 'desc';

const ActividadesTable: React.FC = () => {
  const { 
    actividades, 
    addActividad, 
    updateActividad, 
    deleteActividad, 
    filtros, 
    proyectoActual,
    isAdmin 
  } = useAppContext();

  // Estado para ordenamiento
  const [sortConfig, setSortConfig] = useState<{
    field: SortField,
    direction: SortDirection
  }>({
    field: 'fechaInicio', 
    direction: 'asc'
  });
  
  // Estado para filtros adicionales
  const [filtrosLocales, setFiltrosLocales] = useState({
    duracionMinima: "",
    duracionMaxima: "",
    mostrarSoloVencidas: false
  });

  // Estado para la actividad en edición
  const [actividadEditando, setActividadEditando] = useState<Actividad | null>(null);
  
  // Estado para controlar el diálogo de edición
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Estado para el ID de la actividad a eliminar
  const [actividadAEliminar, setActividadAEliminar] = useState<string | null>(null);

  // Función para cambiar el ordenamiento
  const requestSort = (field: SortField) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  // Filtrar y ordenar actividades
  const actividadesFiltradas = React.useMemo(() => {
    // Aplicar filtros del contexto
    let resultado = actividades.filter(actividad => {
      // Filtrar por proyecto si no es "todos"
      if (filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
        return false;
      }
      
      // Filtrar por sistema si está seleccionado
      if (filtros.sistema && filtros.sistema !== "todos" && actividad.sistema !== filtros.sistema) {
        return false;
      }
      
      // Filtrar por subsistema si está seleccionado
      if (filtros.subsistema && filtros.subsistema !== "todos" && actividad.subsistema !== filtros.subsistema) {
        return false;
      }
      
      // Filtrar por texto de búsqueda
      if (filtros.busquedaActividad && !actividad.nombre.toLowerCase().includes(filtros.busquedaActividad.toLowerCase())) {
        return false;
      }

      // Filtros locales adicionales
      if (filtrosLocales.duracionMinima && actividad.duracion < parseInt(filtrosLocales.duracionMinima)) {
        return false;
      }

      if (filtrosLocales.duracionMaxima && actividad.duracion > parseInt(filtrosLocales.duracionMaxima)) {
        return false;
      }
      
      return true;
    });

    // Aplicar ordenamiento
    resultado.sort((a, b) => {
      if (sortConfig.field === 'nombre') {
        return sortConfig.direction === 'asc' 
          ? a.nombre.localeCompare(b.nombre)
          : b.nombre.localeCompare(a.nombre);
      }
      
      if (sortConfig.field === 'sistema') {
        return sortConfig.direction === 'asc' 
          ? a.sistema.localeCompare(b.sistema)
          : b.sistema.localeCompare(a.sistema);
      }
      
      if (sortConfig.field === 'subsistema') {
        return sortConfig.direction === 'asc' 
          ? a.subsistema.localeCompare(b.subsistema)
          : b.subsistema.localeCompare(a.subsistema);
      }
      
      if (sortConfig.field === 'fechaInicio') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
          : new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
      }
      
      if (sortConfig.field === 'fechaFin') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.fechaFin).getTime() - new Date(b.fechaFin).getTime()
          : new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
      }
      
      if (sortConfig.field === 'duracion') {
        return sortConfig.direction === 'asc' 
          ? a.duracion - b.duracion
          : b.duracion - a.duracion;
      }
      
      return 0;
    });

    return resultado;
  }, [actividades, filtros, sortConfig, filtrosLocales]);

  // Función para abrir el diálogo de edición
  const handleEditActividad = (actividad: Actividad) => {
    setActividadEditando({...actividad});
    setShowEditDialog(true);
  };
  
  // Función para guardar los cambios de la actividad
  const handleSaveActividad = () => {
    if (actividadEditando) {
      // Validar campos requeridos
      if (!actividadEditando.nombre.trim() || !actividadEditando.sistema.trim() || !actividadEditando.subsistema.trim()) {
        toast.error("Todos los campos son obligatorios");
        return;
      }

      // Calcular la duración en días si cambiaron las fechas
      const inicio = new Date(actividadEditando.fechaInicio);
      const fin = new Date(actividadEditando.fechaFin);
      const duracionDias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      if (duracionDias < 0) {
        toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
        return;
      }
      
      // Actualizar la duración
      const actividadActualizada = {
        ...actividadEditando,
        duracion: duracionDias
      };
      
      updateActividad(actividadActualizada.id, actividadActualizada);
      setShowEditDialog(false);
      toast.success("Actividad actualizada exitosamente", {
        description: "Los cambios se han guardado correctamente."
      });
    }
  };
  
  // Función para confirmar la eliminación
  const handleConfirmDelete = () => {
    if (actividadAEliminar) {
      deleteActividad(actividadAEliminar);
      setActividadAEliminar(null);
      toast.success("Actividad eliminada exitosamente");
    }
  };

  // Función para agregar una nueva actividad
  const handleAddActividad = () => {
    // Esta es la manera correcta de crear una nueva actividad, asegurándose de que tenga todos los campos requeridos
    const nuevaActividad: Actividad = {
      id: `actividad-${Date.now()}`,
      proyectoId: proyectoActual !== "todos" ? proyectoActual : "", // Este campo es obligatorio
      nombre: "Nueva actividad",
      sistema: "Sistema ejemplo",
      subsistema: "Subsistema ejemplo",
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duracion: 7
    };
    
    addActividad(nuevaActividad);
    toast.success("Actividad agregada. Edita sus detalles.");
  };

  // Función para exportar las actividades a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Listado de Actividades", 14, 20);
    
    if (actividadesFiltradas.length > 0) {
      const actividadesData = actividadesFiltradas.map(act => [
        act.id.substring(0, 8),
        act.nombre,
        act.sistema,
        act.subsistema,
        new Date(act.fechaInicio).toLocaleDateString('es-ES'),
        new Date(act.fechaFin).toLocaleDateString('es-ES'),
        `${act.duracion} días`
      ]);

      (doc as any).autoTable({
        startY: 30,
        head: [['ID', 'Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración']],
        body: actividadesData,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99] }
      });
    } else {
      doc.text("No hay actividades para mostrar", 14, 30);
    }
    
    doc.save("actividades.pdf");
    toast.success("PDF de actividades generado exitosamente");
  };

  // Componente para mostrar ícono de ordenamiento
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <List className="h-4 w-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <SortAsc className="h-4 w-4 text-indigo-500" />
      : <SortDesc className="h-4 w-4 text-indigo-500" />;
  };

  // Manejar cambio de fecha de inicio
  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (actividadEditando) {
      const fechaInicio = e.target.value;
      setActividadEditando({
        ...actividadEditando,
        fechaInicio: new Date(fechaInicio).toISOString()
      });
    }
  };

  // Manejar cambio de fecha de fin
  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (actividadEditando) {
      const fechaFin = e.target.value;
      setActividadEditando({
        ...actividadEditando,
        fechaFin: new Date(fechaFin).toISOString()
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Actividades</h2>
          <p className="text-sm text-muted-foreground">Total: {actividadesFiltradas.length}</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={exportarPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar a PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleAddActividad}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Actividad
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agregar nueva actividad</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar actividades..."
            className="pl-8"
            value={filtros.busquedaActividad || ""}
            onChange={(e) => {
              // Esta función ya está en el contexto, solo la propagamos
              const event = e;
              if (typeof window !== 'undefined') {
                // Crear un evento personalizado
                const customEvent = new CustomEvent('filtroActividad', { 
                  detail: { value: event.target.value } 
                });
                window.dispatchEvent(customEvent);
              }
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Duración mín."
              className="w-28"
              value={filtrosLocales.duracionMinima}
              onChange={(e) => setFiltrosLocales({
                ...filtrosLocales,
                duracionMinima: e.target.value
              })}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-gray-400" />
            <Input
              type="number"
              placeholder="Duración máx."
              className="w-28"
              value={filtrosLocales.duracionMaxima}
              onChange={(e) => setFiltrosLocales({
                ...filtrosLocales,
                duracionMaxima: e.target.value
              })}
            />
          </div>
          
          <Button
            variant={filtrosLocales.mostrarSoloVencidas ? "default" : "outline"}
            onClick={() => setFiltrosLocales({
              ...filtrosLocales,
              mostrarSoloVencidas: !filtrosLocales.mostrarSoloVencidas
            })}
            className={filtrosLocales.mostrarSoloVencidas ? "bg-red-500 hover:bg-red-600" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Vencidas
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => requestSort('nombre')}
              >
                <div className="flex items-center">
                  Nombre
                  <SortIcon field="nombre" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => requestSort('sistema')}
              >
                <div className="flex items-center">
                  Sistema
                  <SortIcon field="sistema" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => requestSort('subsistema')}
              >
                <div className="flex items-center">
                  Subsistema
                  <SortIcon field="subsistema" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => requestSort('fechaInicio')}
              >
                <div className="flex items-center">
                  Fecha Inicio
                  <SortIcon field="fechaInicio" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => requestSort('fechaFin')}
              >
                <div className="flex items-center">
                  Fecha Fin
                  <SortIcon field="fechaFin" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => requestSort('duracion')}
              >
                <div className="flex items-center">
                  Duración
                  <SortIcon field="duracion" />
                </div>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actividadesFiltradas.length > 0 ? (
              actividadesFiltradas.map((actividad) => (
                <TableRow 
                  key={actividad.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <TableCell className="font-medium">{actividad.id.substring(0, 8)}...</TableCell>
                  <TableCell>{actividad.nombre}</TableCell>
                  <TableCell>{actividad.sistema}</TableCell>
                  <TableCell>{actividad.subsistema}</TableCell>
                  <TableCell>{new Date(actividad.fechaInicio).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(actividad.fechaFin).toLocaleDateString()}</TableCell>
                  <TableCell>{actividad.duracion} días</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditActividad(actividad)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar actividad</p>
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
                                    Esta acción eliminará permanentemente la actividad "{actividad.nombre}".
                                    Esta acción no puede deshacerse.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteActividad(actividad.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar actividad</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                  No hay actividades disponibles para los filtros seleccionados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de edición de actividad */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Actividad</DialogTitle>
            <DialogDescription>
              Modifique los datos de la actividad
            </DialogDescription>
          </DialogHeader>
          
          {actividadEditando && (
            <div className="grid gap-4 py-3">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="nombreActividad">Nombre de Actividad *</Label>
                <Input 
                  id="nombreActividad"
                  value={actividadEditando.nombre}
                  onChange={(e) => setActividadEditando({
                    ...actividadEditando,
                    nombre: e.target.value
                  })}
                  placeholder="Ej: Montaje de equipos"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sistema">Sistema *</Label>
                  <Input 
                    id="sistema"
                    value={actividadEditando.sistema}
                    onChange={(e) => setActividadEditando({
                      ...actividadEditando,
                      sistema: e.target.value
                    })}
                    placeholder="Ej: Sistema Eléctrico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subsistema">Subsistema *</Label>
                  <Input 
                    id="subsistema"
                    value={actividadEditando.subsistema}
                    onChange={(e) => setActividadEditando({
                      ...actividadEditando,
                      subsistema: e.target.value
                    })}
                    placeholder="Ej: Iluminación"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input 
                    id="fechaInicio"
                    type="date"
                    value={new Date(actividadEditando.fechaInicio).toISOString().split('T')[0]}
                    onChange={handleFechaInicioChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input 
                    id="fechaFin"
                    type="date"
                    value={new Date(actividadEditando.fechaFin).toISOString().split('T')[0]}
                    onChange={handleFechaFinChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (días)</Label>
                  <Input 
                    id="duracion"
                    type="number"
                    value={actividadEditando.duracion}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveActividad}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActividadesTable;
