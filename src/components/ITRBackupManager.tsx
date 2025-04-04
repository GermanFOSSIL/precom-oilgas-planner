
import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Copy, Search, Filter, X } from "lucide-react";
import { ITRB, Actividad } from "@/types";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import ProyectoSelector from "./ProyectoSelector";
import { Badge } from "@/components/ui/badge";

const ITRBackupManager: React.FC = () => {
  const { 
    itrbItems, 
    actividades, 
    proyectos, 
    filtros,
    proyectoActual,
    addITRB, // Añadimos esta función para realmente crear ITRs
    setItrbItems // Añadimos esta función para actualizar ITRBs si es necesario
  } = useAppContext();
  
  // State for filtering
  const [selectedSistema, setSelectedSistema] = useState<string | undefined>(undefined);
  const [selectedSubsistema, setSelectedSubsistema] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedITRs, setSelectedITRs] = useState<Set<string>>(new Set());
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [targetActividadId, setTargetActividadId] = useState<string>("");
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [cantidadNueva, setCantidadNueva] = useState<number>(1); // Nuevo estado para cantidad a asignar

  // Calculate available systems from activities
  const sistemas = useMemo(() => {
    const sistemasSet = new Set<string>();
    
    actividades.forEach(act => {
      if (proyectoActual === "todos" || act.proyectoId === proyectoActual) {
        if (act.sistema && act.sistema.trim() !== "") {
          sistemasSet.add(act.sistema);
        }
      }
    });
    
    return Array.from(sistemasSet).sort();
  }, [actividades, proyectoActual]);
  
  // Calculate available subsystems based on selected system
  const subsistemas = useMemo(() => {
    const subsystemasSet = new Set<string>();
    
    actividades.forEach(act => {
      if ((proyectoActual === "todos" || act.proyectoId === proyectoActual) &&
          (!selectedSistema || act.sistema === selectedSistema)) {
        if (act.subsistema && act.subsistema.trim() !== "") {
          subsystemasSet.add(act.subsistema);
        }
      }
    });
    
    return Array.from(subsystemasSet).sort();
  }, [actividades, proyectoActual, selectedSistema]);

  // Filter ITR Items based on current filters
  const filteredITRs = useMemo(() => {
    return itrbItems.filter(itr => {
      // Find related activity
      const actividad = actividades.find(a => a.id === itr.actividadId);
      
      // Skip if activity doesn't exist
      if (!actividad) return false;
      
      // Filter by project
      if (proyectoActual !== "todos" && actividad.proyectoId !== proyectoActual) {
        return false;
      }
      
      // Filter by system if selected
      if (selectedSistema && actividad.sistema !== selectedSistema) {
        return false;
      }
      
      // Filter by subsystem if selected
      if (selectedSubsistema && actividad.subsistema !== selectedSubsistema) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          itr.descripcion.toLowerCase().includes(searchLower) ||
          actividad.nombre.toLowerCase().includes(searchLower) ||
          actividad.sistema?.toLowerCase().includes(searchLower) ||
          actividad.subsistema?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [itrbItems, actividades, proyectoActual, selectedSistema, selectedSubsistema, searchTerm]);

  // Agrupar ITRs por tipo (para asegurar que solo haya uno de cada tipo)
  const groupedITRs = useMemo(() => {
    const groups = new Map<string, ITRB>();
    
    filteredITRs.forEach(itr => {
      // Detectamos el tipo de ITR (por ejemplo I01A, I02A, etc.) de la descripción
      const match = itr.descripcion.match(/\b([A-Z][0-9]{2}[A-Z])\b/);
      const type = match ? match[1] : itr.descripcion;
      
      // Solo agregamos si no existe ya ese tipo o si ya tenemos este ITR seleccionado
      if (!groups.has(type) || selectedITRs.has(itr.id)) {
        groups.set(type, itr);
      }
    });
    
    return Array.from(groups.values());
  }, [filteredITRs, selectedITRs]);

  // Get available target activities for copying
  const availableActividades = useMemo(() => {
    return actividades.filter(act => 
      (proyectoActual === "todos" || act.proyectoId === proyectoActual)
    );
  }, [actividades, proyectoActual]);

  // Toggle selection of an ITR
  const toggleSelectITR = (itrId: string) => {
    const newSelection = new Set(selectedITRs);
    if (newSelection.has(itrId)) {
      newSelection.delete(itrId);
    } else {
      newSelection.add(itrId);
    }
    setSelectedITRs(newSelection);
  };

  // Select all visible ITRs
  const selectAllVisible = () => {
    const allIds = groupedITRs.map(itr => itr.id);
    setSelectedITRs(new Set(allIds));
  };
  
  // Clear all selections
  const clearSelection = () => {
    setSelectedITRs(new Set());
  };

  // Handle copying ITRs to another activity
  const handleCopyITRs = () => {
    if (selectedITRs.size === 0) {
      toast.error("No hay ITR seleccionados para copiar");
      return;
    }
    
    setShowCopyDialog(true);
  };

  // Perform the actual copy operation
  const performCopy = () => {
    if (!targetActividadId) {
      toast.error("Debe seleccionar una actividad destino");
      return;
    }

    if (cantidadNueva <= 0) {
      toast.error("La cantidad a asignar debe ser mayor que cero");
      return;
    }

    try {
      // Implementamos la copia real de ITRs
      const targetActividad = actividades.find(a => a.id === targetActividadId);
      if (!targetActividad) {
        toast.error("La actividad destino no existe");
        return;
      }

      // Obtenemos los ITRs seleccionados
      const selectedITRBs = itrbItems.filter(itr => selectedITRs.has(itr.id));
      
      // Creamos nuevos ITRs basados en los seleccionados pero asignados a la nueva actividad
      const newITRBs: ITRB[] = [];
      const updatedITRBs: ITRB[] = [];
      
      selectedITRBs.forEach(itr => {
        // Crear una copia del ITR con un nuevo ID
        const newITR: ITRB = {
          id: `itrb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          actividadId: targetActividadId,
          descripcion: itr.descripcion,
          cantidadTotal: cantidadNueva, // Usamos la cantidad especificada por el usuario
          cantidadRealizada: 0, // Comienza con 0 realizadas
          fechaLimite: itr.fechaLimite,
          observaciones: itr.observaciones,
          mcc: itr.mcc,
          estado: "En curso"
        };
        
        // Añadir a la lista de nuevos ITRs
        newITRBs.push(newITR);
        
        // Si no estamos manteniendo el original, actualizar el original para eliminarlo
        if (!keepOriginal) {
          updatedITRBs.push({
            ...itr,
            estado: "Completado",
            cantidadRealizada: itr.cantidadTotal // Marcarlo como completado
          });
        }
      });
      
      // Actualizar el estado global con los nuevos ITRs
      newITRBs.forEach(itr => {
        addITRB(itr);
      });
      
      // Si no mantenemos originales, actualizamos el estado
      if (!keepOriginal && updatedITRBs.length > 0) {
        const allUpdatedITRBs = [...itrbItems];
        
        updatedITRBs.forEach(updatedItr => {
          const index = allUpdatedITRBs.findIndex(i => i.id === updatedItr.id);
          if (index !== -1) {
            allUpdatedITRBs[index] = updatedItr;
          }
        });
        
        setItrbItems(allUpdatedITRBs);
      }
      
      toast.success(`${selectedITRs.size} ITRs ${keepOriginal ? "copiados" : "movidos"} exitosamente a ${targetActividad.nombre}`);
      setShowCopyDialog(false);
      
      // Clear selection if not keeping original (meaning we moved them)
      if (!keepOriginal) {
        setSelectedITRs(new Set());
      }
    } catch (error) {
      console.error("Error al copiar ITRs:", error);
      toast.error("Ocurrió un error al procesar la operación");
    }
  };

  // Find activity details for an ITR
  const getActividadForITR = (itrId: string) => {
    const itr = itrbItems.find(i => i.id === itrId);
    if (!itr) return null;
    
    return actividades.find(a => a.id === itr.actividadId) || null;
  };

  // Render empty state
  if (filteredITRs.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium mb-2">No hay ITRs disponibles</h3>
        <p className="text-muted-foreground">
          No se encontraron ITRs que coincidan con los filtros actuales.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedSistema(undefined);
              setSelectedSubsistema(undefined);
              setSearchTerm("");
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div>
            <Label htmlFor="sistema">Sistema</Label>
            <Select
              value={selectedSistema}
              onValueChange={(val) => {
                setSelectedSistema(val === "todos" ? undefined : val);
                setSelectedSubsistema(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los sistemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sistemas</SelectItem>
                {sistemas.map((sistema) => (
                  <SelectItem key={sistema} value={sistema}>
                    {sistema || "Sin nombre"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="subsistema">Subsistema</Label>
            <Select
              value={selectedSubsistema}
              onValueChange={(val) => setSelectedSubsistema(val === "todos" ? undefined : val)}
              disabled={!selectedSistema}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los subsistemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los subsistemas</SelectItem>
                {subsistemas.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub || "Sin nombre"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar ITR..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <X
                  className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {selectedITRs.size} ITR{selectedITRs.size !== 1 ? "s" : ""} seleccionado{selectedITRs.size !== 1 ? "s" : ""}
          </span>
          {selectedITRs.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Limpiar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={selectAllVisible}>
            Seleccionar todos
          </Button>
          <Button 
            size="sm" 
            disabled={selectedITRs.size === 0}
            onClick={handleCopyITRs}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar/Transferir
          </Button>
        </div>
      </div>

      {/* ITRs Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Actividad</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Subsistema</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Progreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Mostramos ITRs agrupados, un solo tipo de cada */}
            {groupedITRs.map((itr) => {
              const actividad = actividades.find(a => a.id === itr.actividadId);
              return (
                <TableRow key={itr.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedITRs.has(itr.id)}
                      onCheckedChange={() => toggleSelectITR(itr.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{itr.descripcion}</TableCell>
                  <TableCell>{actividad?.nombre || "N/A"}</TableCell>
                  <TableCell>{actividad?.sistema || "N/A"}</TableCell>
                  <TableCell>{actividad?.subsistema || "N/A"}</TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        itr.estado === "Completado" ? "bg-green-500" : 
                        itr.estado === "Vencido" ? "bg-red-500" : 
                        "bg-yellow-500"
                      }
                    >
                      {itr.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {itr.cantidadRealizada} / {itr.cantidadTotal}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Copy Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar/Transferir ITRs</DialogTitle>
            <DialogDescription>
              Selecciona la actividad a la que deseas copiar los {selectedITRs.size} ITRs seleccionados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Actividad destino</Label>
              <Select
                value={targetActividadId}
                onValueChange={setTargetActividadId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar actividad" />
                </SelectTrigger>
                <SelectContent>
                  {availableActividades.map((act) => (
                    <SelectItem key={act.id} value={act.id}>
                      {act.nombre} ({act.sistema || 'Sin sistema'}: {act.subsistema || 'Sin subsistema'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Agregamos input para cantidad a asignar */}
            <div className="space-y-2">
              <Label htmlFor="cantidadNueva">Cantidad a asignar</Label>
              <Input
                id="cantidadNueva"
                type="number"
                min="1"
                value={cantidadNueva}
                onChange={(e) => setCantidadNueva(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="keepOriginal"
                checked={keepOriginal}
                onCheckedChange={(checked) => setKeepOriginal(checked === true)}
              />
              <Label htmlFor="keepOriginal">
                Mantener ITRs en actividad original (copiar en lugar de mover)
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={performCopy}>
              {keepOriginal ? "Copiar ITRs" : "Mover ITRs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITRBackupManager;
