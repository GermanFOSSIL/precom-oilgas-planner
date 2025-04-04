
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, FileSpreadsheet, Save, X, CheckSquare } from "lucide-react";
import { ITRB, Proyecto, Actividad } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ITRBackupManagerProps {
  itrId?: string;
}

const ITRBackupManager: React.FC<ITRBackupManagerProps> = ({ itrId }) => {
  const { proyectos, itrbItems, actividades, addITRB, updateITRB } = useAppContext();
  
  // Estados para filtrado y selección
  const [selectedITRs, setSelectedITRs] = useState<string[]>(itrId ? [itrId] : []);
  const [targetProyecto, setTargetProyecto] = useState<string>("");
  const [targetSistema, setTargetSistema] = useState<string>("");
  const [targetSubsistema, setTargetSubsistema] = useState<string>("");
  const [targetActividad, setTargetActividad] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [keepOriginal, setKeepOriginal] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newNames, setNewNames] = useState<{[key: string]: string}>({});
  
  // Estados para filtrado de ITRs
  const [filtroProyecto, setFiltroProyecto] = useState<string>("");
  const [filtroSistema, setFiltroSistema] = useState<string>("");
  const [filtroSubsistema, setFiltroSubsistema] = useState<string>("");
  const [busquedaITR, setBusquedaITR] = useState<string>("");
  
  // Sistemas disponibles basados en el proyecto seleccionado (para el destino)
  const sistemasDisponibles = targetProyecto 
    ? [...new Set(actividades.filter(a => a.proyectoId === targetProyecto).map(a => a.sistema))]
    : [];
  
  // Subsistemas disponibles basados en el sistema y proyecto seleccionado (para el destino)
  const subsistemasDisponibles = targetProyecto && targetSistema
    ? [...new Set(actividades
        .filter(a => a.proyectoId === targetProyecto && a.sistema === targetSistema)
        .map(a => a.subsistema))]
    : [];
  
  // Actividades filtradas para destino
  const actividadesFiltradas = targetProyecto
    ? actividades.filter(act => {
        if (act.proyectoId !== targetProyecto) return false;
        if (targetSistema && act.sistema !== targetSistema) return false;
        if (targetSubsistema && act.subsistema !== targetSubsistema) return false;
        return true;
      })
    : [];
  
  // ITRs filtrados para selección
  const itrsFiltrados = itrbItems.filter(itr => {
    const actividad = actividades.find(a => a.id === itr.actividadId);
    if (!actividad) return false;
    
    if (filtroProyecto && actividad.proyectoId !== filtroProyecto) return false;
    if (filtroSistema && actividad.sistema !== filtroSistema) return false;
    if (filtroSubsistema && actividad.subsistema !== filtroSubsistema) return false;
    if (busquedaITR && !itr.descripcion.toLowerCase().includes(busquedaITR.toLowerCase())) return false;
    
    return true;
  });
  
  // Proyectos para filtros
  const proyectosDisponiblesFiltro = [...new Set(proyectos.map(p => p.id))];
  
  // Sistemas disponibles para filtros
  const sistemasDisponiblesFiltro = filtroProyecto 
    ? [...new Set(actividades.filter(a => a.proyectoId === filtroProyecto).map(a => a.sistema))]
    : [...new Set(actividades.map(a => a.sistema))];
  
  // Subsistemas disponibles para filtros
  const subsistemasDisponiblesFiltro = filtroSistema 
    ? [...new Set(actividades
        .filter(a => (!filtroProyecto || a.proyectoId === filtroProyecto) && a.sistema === filtroSistema)
        .map(a => a.subsistema))]
    : [...new Set(actividades
        .filter(a => !filtroProyecto || a.proyectoId === filtroProyecto)
        .map(a => a.subsistema))];

  useEffect(() => {
    // Inicializar con el ITR seleccionado si viene como prop
    if (itrId) {
      const itr = itrbItems.find(i => i.id === itrId);
      if (itr) {
        setSelectedITRs([itrId]);
        setNewNames({[itrId]: itr.descripcion});
      }
    }
  }, [itrId, itrbItems]);

  // Reset
  useEffect(() => {
    if (targetProyecto === "") {
      setTargetSistema("");
      setTargetSubsistema("");
      setTargetActividad("");
    }
  }, [targetProyecto]);

  useEffect(() => {
    if (targetSistema === "") {
      setTargetSubsistema("");
      setTargetActividad("");
    }
  }, [targetSistema]);

  useEffect(() => {
    if (targetSubsistema === "") {
      setTargetActividad("");
    }
  }, [targetSubsistema]);

  useEffect(() => {
    // Actualizar los nombres predeterminados cuando cambian los ITRs seleccionados
    const namesObj: {[key: string]: string} = {};
    selectedITRs.forEach(id => {
      const itr = itrbItems.find(i => i.id === id);
      if (itr) {
        namesObj[id] = newNames[id] || itr.descripcion;
      }
    });
    setNewNames(namesObj);
  }, [selectedITRs, itrbItems]);

  const handleToggleITR = (itrId: string) => {
    setSelectedITRs(prev => {
      if (prev.includes(itrId)) {
        return prev.filter(id => id !== itrId);
      } else {
        return [...prev, itrId];
      }
    });
  };

  const handleNameChange = (id: string, value: string) => {
    setNewNames(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const getActividadYProyecto = (itr: ITRB): {actividad?: Actividad, proyecto?: Proyecto} => {
    const actividad = actividades.find(a => a.id === itr.actividadId);
    const proyecto = actividad ? proyectos.find(p => p.id === actividad.proyectoId) : undefined;
    return { actividad, proyecto };
  };

  const handleReasignarITRs = () => {
    if (selectedITRs.length === 0) {
      toast.error("Seleccione al menos un ITR para reasignar");
      return;
    }

    if (!targetProyecto || !targetActividad) {
      toast.error("Seleccione un proyecto y actividad destino");
      return;
    }

    try {
      let successCount = 0;
      
      selectedITRs.forEach(itrId => {
        const itrOriginal = itrbItems.find(itr => itr.id === itrId);
        
        if (!itrOriginal) return;

        // Crear nuevo ITR con los datos del original pero con nueva actividad
        const nuevoITR: ITRB = {
          ...itrOriginal,
          id: `itr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          actividadId: targetActividad,
          descripcion: newNames[itrId] || itrOriginal.descripcion
        };

        // Agregar el nuevo ITR
        addITRB(nuevoITR);
        successCount++;

        // Si no queremos mantener el original, actualizarlo a completado o similar
        if (!keepOriginal) {
          // Marcar el original como completado
          const itrActualizado = {
            ...itrOriginal,
            cantidadRealizada: itrOriginal.cantidadTotal,
            estado: "Completado" as const
          };
          
          updateITRB(itrOriginal.id, itrActualizado);
        }
      });

      toast.success(`${successCount} ITR${successCount !== 1 ? 's' : ''} reasignado${successCount !== 1 ? 's' : ''} exitosamente`, {
        description: keepOriginal 
          ? "Se han creado copias en la nueva actividad" 
          : "Los ITRs han sido movidos a la nueva actividad"
      });

      // Cerrar el diálogo
      setDialogOpen(false);
      
      // Limpiar estados si no es un ITR específico
      if (!itrId) {
        setSelectedITRs([]);
      }
      setTargetProyecto("");
      setTargetSistema("");
      setTargetSubsistema("");
      setTargetActividad("");
      setNewNames({});
      
    } catch (error) {
      console.error("Error al reasignar ITR:", error);
      toast.error("Error al reasignar los ITRs", {
        description: "Ocurrió un problema al procesar la solicitud"
      });
    }
  };

  const exportITRsAsJSON = () => {
    if (selectedITRs.length === 0) {
      toast.error("Seleccione al menos un ITR para exportar");
      return;
    }

    try {
      const exportData = selectedITRs.map(id => {
        const itr = itrbItems.find(i => i.id === id);
        if (!itr) return null;
        
        const { actividad, proyecto } = getActividadYProyecto(itr);
        
        return {
          itr: itr,
          metadata: {
            actividad: actividad ? {
              id: actividad.id,
              nombre: actividad.nombre,
              sistema: actividad.sistema,
              subsistema: actividad.subsistema
            } : null,
            proyecto: proyecto ? {
              id: proyecto.id,
              titulo: proyecto.titulo
            } : null,
            fechaExportacion: new Date().toISOString()
          }
        };
      }).filter(Boolean);
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `itrs-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success(`${selectedITRs.length} ITR${selectedITRs.length !== 1 ? 's' : ''} exportado${selectedITRs.length !== 1 ? 's' : ''} exitosamente`);
      
    } catch (error) {
      console.error("Error al exportar ITRs:", error);
      toast.error("Error al exportar los ITRs");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Gestor de ITR
        </CardTitle>
        <CardDescription>
          Exporta, copia o reasigna ITRs entre proyectos y actividades
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtros de ITR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b pb-4">
          <div className="space-y-2">
            <Label htmlFor="filtro-proyecto">Filtrar por proyecto</Label>
            <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
              <SelectTrigger id="filtro-proyecto">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los proyectos</SelectItem>
                {proyectosDisponiblesFiltro.map(id => {
                  const proyecto = proyectos.find(p => p.id === id);
                  return (
                    <SelectItem key={id} value={id}>
                      {proyecto?.titulo || id}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filtro-sistema">Filtrar por sistema</Label>
            <Select value={filtroSistema} onValueChange={setFiltroSistema} disabled={sistemasDisponiblesFiltro.length === 0}>
              <SelectTrigger id="filtro-sistema">
                <SelectValue placeholder="Todos los sistemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los sistemas</SelectItem>
                {sistemasDisponiblesFiltro.map(sistema => (
                  <SelectItem key={sistema} value={sistema}>{sistema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filtro-subsistema">Filtrar por subsistema</Label>
            <Select value={filtroSubsistema} onValueChange={setFiltroSubsistema} disabled={subsistemasDisponiblesFiltro.length === 0}>
              <SelectTrigger id="filtro-subsistema">
                <SelectValue placeholder="Todos los subsistemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los subsistemas</SelectItem>
                {subsistemasDisponiblesFiltro.map(subsistema => (
                  <SelectItem key={subsistema} value={subsistema}>{subsistema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-full">
            <div className="relative">
              <Input
                placeholder="Buscar ITRs por nombre..."
                value={busquedaITR}
                onChange={(e) => setBusquedaITR(e.target.value)}
                className="pr-8"
              />
              {busquedaITR && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setBusquedaITR("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Lista de ITRs seleccionables */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">
              ITRs disponibles ({itrsFiltrados.length})
            </Label>
            <div className="text-xs text-muted-foreground">
              {selectedITRs.length} seleccionados
            </div>
          </div>
          
          <ScrollArea className="h-[200px] border rounded-md p-2">
            {itrsFiltrados.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No se encontraron ITRs con los filtros aplicados
              </div>
            ) : (
              <div className="space-y-1">
                {itrsFiltrados.map(itr => {
                  const { actividad, proyecto } = getActividadYProyecto(itr);
                  const isSelected = selectedITRs.includes(itr.id);
                  
                  return (
                    <div 
                      key={itr.id} 
                      className={`flex items-center p-2 rounded-md ${
                        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleToggleITR(itr.id)}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => handleToggleITR(itr.id)}
                        className="mr-2"
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium truncate">
                          {itr.descripcion}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {proyecto?.titulo || 'Sin proyecto'} &bull; {actividad?.sistema || '-'} &bull; {actividad?.subsistema || '-'}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        itr.estado === 'Completado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        itr.estado === 'Vencido' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {itr.cantidadRealizada}/{itr.cantidadTotal} • {itr.estado}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <div className="flex space-x-2 pt-2 border-t">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={exportITRsAsJSON}
            disabled={selectedITRs.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Exportar {selectedITRs.length} ITR{selectedITRs.length !== 1 ? 's' : ''}
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full"
                disabled={selectedITRs.length === 0}
              >
                <Copy className="h-4 w-4 mr-2" />
                Reasignar {selectedITRs.length} ITR{selectedITRs.length !== 1 ? 's' : ''}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Reasignar {selectedITRs.length} ITR{selectedITRs.length !== 1 ? 's' : ''}</DialogTitle>
                <DialogDescription>
                  Seleccione el proyecto, sistema, subsistema y actividad destino para los ITRs
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proyecto-destino">Proyecto destino *</Label>
                    <Select
                      value={targetProyecto}
                      onValueChange={setTargetProyecto}
                    >
                      <SelectTrigger id="proyecto-destino">
                        <SelectValue placeholder="Seleccione proyecto destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {proyectos.map(proyecto => (
                          <SelectItem key={proyecto.id} value={proyecto.id}>
                            {proyecto.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sistema-destino">Sistema destino *</Label>
                    <Select
                      value={targetSistema}
                      onValueChange={setTargetSistema}
                      disabled={!targetProyecto || sistemasDisponibles.length === 0}
                    >
                      <SelectTrigger id="sistema-destino">
                        <SelectValue placeholder="Seleccione sistema destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {sistemasDisponibles.map(sistema => (
                          <SelectItem key={sistema} value={sistema}>
                            {sistema}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subsistema-destino">Subsistema destino *</Label>
                    <Select
                      value={targetSubsistema}
                      onValueChange={setTargetSubsistema}
                      disabled={!targetSistema || subsistemasDisponibles.length === 0}
                    >
                      <SelectTrigger id="subsistema-destino">
                        <SelectValue placeholder="Seleccione subsistema destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {subsistemasDisponibles.map(subsistema => (
                          <SelectItem key={subsistema} value={subsistema}>
                            {subsistema}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="actividad-destino">Actividad destino *</Label>
                    <Select
                      value={targetActividad}
                      onValueChange={setTargetActividad}
                      disabled={!targetSubsistema || actividadesFiltradas.length === 0}
                    >
                      <SelectTrigger id="actividad-destino">
                        <SelectValue placeholder="Seleccione actividad destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {actividadesFiltradas
                          .filter(act => 
                            act.sistema === targetSistema && 
                            act.subsistema === targetSubsistema
                          )
                          .map(actividad => (
                            <SelectItem key={actividad.id} value={actividad.id}>
                              {actividad.nombre}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Nombres de ITRs seleccionados */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-sm font-medium">Nombres de ITRs a reasignar</Label>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-2">
                      {selectedITRs.map(id => {
                        const itr = itrbItems.find(i => i.id === id);
                        if (!itr) return null;
                        
                        return (
                          <div key={id} className="space-y-1">
                            <Label htmlFor={`itr-name-${id}`} className="text-xs">
                              {itr.descripcion} (Original)
                            </Label>
                            <Input
                              id={`itr-name-${id}`}
                              value={newNames[id] || ''}
                              onChange={(e) => handleNameChange(id, e.target.value)}
                              placeholder="Nombre del ITR"
                              className="text-sm h-8"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="keep-original"
                    checked={keepOriginal}
                    onCheckedChange={() => setKeepOriginal(!keepOriginal)}
                  />
                  <Label htmlFor="keep-original" className="font-medium">
                    Mantener ITRs originales (crear copias)
                  </Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleReasignarITRs}
                  disabled={!targetProyecto || !targetActividad}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Reasignar {selectedITRs.length} ITR{selectedITRs.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ITRBackupManager;
