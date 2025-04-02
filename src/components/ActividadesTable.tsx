
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
  Trash, 
  Plus, 
  Download,
  Filter,
  Calendar,
  CalendarRange,
  Search,
  SortAsc,
  SortDesc,
  List
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
                            <Button variant="ghost" size="icon">
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
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash className="h-4 w-4" />
                            </Button>
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
    </div>
  );
};

export default ActividadesTable;
