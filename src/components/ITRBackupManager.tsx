
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, FileSpreadsheet, Save } from "lucide-react";
import { ITRB, Proyecto } from "@/types";

interface ITRBackupManagerProps {
  itrId?: string;
}

const ITRBackupManager: React.FC<ITRBackupManagerProps> = ({ itrId }) => {
  const { proyectos, itrbItems, actividades, addITRB, updateITRB } = useAppContext();
  
  const [selectedITR, setSelectedITR] = useState<string | undefined>(itrId);
  const [targetProyecto, setTargetProyecto] = useState<string>("");
  const [targetActividad, setTargetActividad] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [keepOriginal, setKeepOriginal] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Filtrar actividades por proyecto seleccionado
  const actividadesFiltradas = targetProyecto 
    ? actividades.filter(act => act.proyectoId === targetProyecto)
    : [];
  
  // Obtener el ITR seleccionado
  const itrSeleccionado = selectedITR 
    ? itrbItems.find(itr => itr.id === selectedITR) 
    : undefined;
  
  // Obtener actividad asociada al ITR seleccionado
  const actividadOriginal = itrSeleccionado 
    ? actividades.find(act => act.id === itrSeleccionado.actividadId)
    : undefined;
  
  // Obtener proyecto original
  const proyectoOriginal = actividadOriginal
    ? proyectos.find(p => p.id === actividadOriginal.proyectoId)
    : undefined;

  const handleSelectITR = (itrId: string) => {
    setSelectedITR(itrId);
    const itr = itrbItems.find(i => i.id === itrId);
    if (itr) {
      setNewName(itr.descripcion);
    }
  };

  const handleSelectProyecto = (proyectoId: string) => {
    setTargetProyecto(proyectoId);
    setTargetActividad("");  // Reset actividad cuando cambia el proyecto
  };

  const handleReasignarITR = () => {
    if (!selectedITR || !targetProyecto || !targetActividad) {
      toast.error("Seleccione un ITR, proyecto y actividad destino");
      return;
    }

    const itrOriginal = itrbItems.find(itr => itr.id === selectedITR);
    
    if (!itrOriginal) {
      toast.error("No se encontró el ITR seleccionado");
      return;
    }

    try {
      // Crear nuevo ITR con los datos del original pero con nueva actividad
      const nuevoITR: ITRB = {
        ...itrOriginal,
        id: `itr-${Date.now()}`,
        actividadId: targetActividad,
        descripcion: newName || itrOriginal.descripcion
      };

      // Agregar el nuevo ITR
      addITRB(nuevoITR);

      // Si no queremos mantener el original, actualizarlo a completado o similar
      if (!keepOriginal) {
        // Marcar el original como completado o eliminarlo según necesidad
        const itrActualizado = {
          ...itrOriginal,
          cantidadRealizada: itrOriginal.cantidadTotal,
          estado: "Completado" as const
        };
        
        updateITRB(itrOriginal.id, itrActualizado);
      }

      toast.success("ITR reasignado exitosamente", {
        description: keepOriginal 
          ? "Se ha creado una copia en la nueva actividad" 
          : "El ITR ha sido movido a la nueva actividad"
      });

      // Cerrar el diálogo
      setDialogOpen(false);
      
      // Limpiar estados
      if (!itrId) {
        setSelectedITR(undefined);
      }
      setTargetProyecto("");
      setTargetActividad("");
      setNewName("");
      
    } catch (error) {
      console.error("Error al reasignar ITR:", error);
      toast.error("Error al reasignar el ITR", {
        description: "Ocurrió un problema al procesar la solicitud"
      });
    }
  };

  const exportITRAsJSON = () => {
    if (!selectedITR) {
      toast.error("Seleccione un ITR para exportar");
      return;
    }

    const itr = itrbItems.find(i => i.id === selectedITR);
    
    if (!itr) {
      toast.error("No se encontró el ITR seleccionado");
      return;
    }

    try {
      const actividad = actividades.find(a => a.id === itr.actividadId);
      const proyecto = actividad ? proyectos.find(p => p.id === actividad.proyectoId) : undefined;
      
      const exportData = {
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
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `itr-${itr.descripcion.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("ITR exportado exitosamente");
      
    } catch (error) {
      console.error("Error al exportar ITR:", error);
      toast.error("Error al exportar el ITR");
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
        <div className="space-y-2">
          <Label htmlFor="itr-select">Seleccionar ITR</Label>
          <Select 
            value={selectedITR} 
            onValueChange={handleSelectITR}
          >
            <SelectTrigger id="itr-select">
              <SelectValue placeholder="Seleccione un ITR" />
            </SelectTrigger>
            <SelectContent>
              {itrbItems.map(itr => {
                const act = actividades.find(a => a.id === itr.actividadId);
                return (
                  <SelectItem key={itr.id} value={itr.id}>
                    {itr.descripcion} {act ? `(${act.sistema} - ${act.subsistema})` : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        {itrSeleccionado && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm">
              <p className="font-medium">Información del ITR:</p>
              <p><span className="text-muted-foreground">Descripción:</span> {itrSeleccionado.descripcion}</p>
              <p><span className="text-muted-foreground">Proyecto:</span> {proyectoOriginal?.titulo}</p>
              <p><span className="text-muted-foreground">Sistema:</span> {actividadOriginal?.sistema}</p>
              <p><span className="text-muted-foreground">Subsistema:</span> {actividadOriginal?.subsistema}</p>
              <p><span className="text-muted-foreground">Estado:</span> {itrSeleccionado.estado}</p>
              <p><span className="text-muted-foreground">Avance:</span> {itrSeleccionado.cantidadRealizada}/{itrSeleccionado.cantidadTotal}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={exportITRAsJSON}
              >
                <Save className="h-4 w-4 mr-2" />
                Exportar ITR
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Reasignar ITR
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reasignar ITR</DialogTitle>
                    <DialogDescription>
                      Seleccione el proyecto y actividad destino para el ITR
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Nombre del ITR</Label>
                      <Input
                        id="new-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nombre del ITR"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="proyecto-destino">Proyecto destino</Label>
                      <Select
                        value={targetProyecto}
                        onValueChange={handleSelectProyecto}
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
                      <Label htmlFor="actividad-destino">Actividad destino</Label>
                      <Select
                        value={targetActividad}
                        onValueChange={setTargetActividad}
                        disabled={!targetProyecto}
                      >
                        <SelectTrigger id="actividad-destino">
                          <SelectValue placeholder="Seleccione actividad destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {actividadesFiltradas.map(actividad => (
                            <SelectItem key={actividad.id} value={actividad.id}>
                              {actividad.nombre} ({actividad.sistema} - {actividad.subsistema})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="keep-original"
                        checked={keepOriginal}
                        onCheckedChange={() => setKeepOriginal(!keepOriginal)}
                      />
                      <Label htmlFor="keep-original">
                        Mantener ITR original (crear copia)
                      </Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleReasignarITR}>
                      Reasignar ITR
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ITRBackupManager;
