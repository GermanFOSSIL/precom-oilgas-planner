import React, { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackupOptions, Proyecto } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const BackupRestoreUploader = () => {
  const { 
    proyectos, 
    setProyectos, 
    actividades, 
    setActividades, 
    setItrbItems, 
    setAlertas,
    updateKPIConfig,
    addProyecto
  } = useAppContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<any>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [targetProyectoId, setTargetProyectoId] = useState<string>("new");
  const [newProyectoNombre, setNewProyectoNombre] = useState<string>("");
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Leer el archivo
      const fileContent = await readFileAsText(file);
      let parsedData;
      
      try {
        parsedData = JSON.parse(fileContent);
      } catch (error) {
        setError("El archivo no contiene un formato JSON válido");
        clearInterval(progressInterval);
        setIsUploading(false);
        setProgress(0);
        return;
      }
      
      // Validar estructura mínima del backup
      if (!parsedData || typeof parsedData !== "object") {
        setError("El formato del backup es inválido");
        clearInterval(progressInterval);
        setIsUploading(false);
        setProgress(0);
        return;
      }
      
      // Guardar datos del backup para su uso posterior
      setBackupData(parsedData);
      
      // Finalizar carga
      clearInterval(progressInterval);
      setProgress(100);
      
      // Si hay proyectos en el backup, proponemos el nombre del primero
      if (parsedData.proyectos && Array.isArray(parsedData.proyectos) && parsedData.proyectos.length > 0) {
        setNewProyectoNombre(parsedData.proyectos[0].titulo);
      }
      
      // Mostrar diálogo para seleccionar proyecto
      setTimeout(() => {
        setIsUploading(false);
        setShowRestoreDialog(true);
      }, 500);
      
    } catch (error) {
      console.error("Error al leer backup:", error);
      setError(`Error al leer el backup: ${error instanceof Error ? error.message : "Error desconocido"}`);
      setIsUploading(false);
      setProgress(0);
    }
  };
  
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Error al leer el archivo"));
        }
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsText(file);
    });
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRestoreBackup = () => {
    if (!backupData) return;
    
    try {
      let targetProyectoIdToUse = targetProyectoId;
      
      // Si es un nuevo proyecto, crearlo
      if (targetProyectoId === "new") {
        if (!newProyectoNombre.trim()) {
          toast.error("Debe ingresar un nombre para el nuevo proyecto");
          return;
        }
        
        const now = new Date().toISOString();
        const nuevoProyecto: Proyecto = {
          id: `proyecto-${Date.now()}`,
          titulo: newProyectoNombre,
          descripcion: backupData.proyectos && backupData.proyectos.length > 0 
            ? backupData.proyectos[0].descripcion || "" 
            : "",
          fechaCreacion: now,
          fechaActualizacion: now
        };
        
        addProyecto(nuevoProyecto);
        targetProyectoIdToUse = nuevoProyecto.id;
      }
      
      // Mapear proyectos del backup al proyecto seleccionado
      if (backupData.proyectos && Array.isArray(backupData.proyectos)) {
        // Si es un nuevo proyecto, no necesitamos preservar los existentes
        if (targetProyectoId === "new") {
          setProyectos([...proyectos]);
        } else {
          // Si se eligió un proyecto existente, no tocamos los proyectos
          // ya que solo importaremos al proyecto seleccionado
        }
      }
      
      // Procesar actividades: solo importar las del proyecto original que correspondan
      if (backupData.actividades && Array.isArray(backupData.actividades)) {
        const actividadesModificadas = [...backupData.actividades];
        
        if (backupData.proyectos && backupData.proyectos.length > 0) {
          const proyectoOriginalId = backupData.proyectos[0].id;
          
          // Actualizar proyectoId de las actividades para que apunten al proyecto seleccionado
          actividadesModificadas.forEach(act => {
            if (act.proyectoId === proyectoOriginalId) {
              act.proyectoId = targetProyectoIdToUse;
            }
          });
        }
        
        // Fusionar con las actividades existentes
        const actividadesExistentes = [...actividades];
        setActividades([...actividadesExistentes, ...actividadesModificadas]);
      }
      
      // Procesar ITRBs: deben asignarse a las actividades correctas
      if (backupData.itrbItems && Array.isArray(backupData.itrbItems)) {
        setItrbItems([...backupData.itrbItems]);
      }
      
      // Procesar alertas
      if (backupData.alertas && Array.isArray(backupData.alertas)) {
        setAlertas([...backupData.alertas]);
      }
      
      // Procesar configuración de KPIs
      if (backupData.kpiConfig && typeof backupData.kpiConfig === "object") {
        updateKPIConfig(backupData.kpiConfig);
      }
      
      toast.success("Backup restaurado exitosamente", {
        description: targetProyectoId === "new" 
          ? `Se ha creado un nuevo proyecto: ${newProyectoNombre}` 
          : "Los datos han sido cargados en el proyecto seleccionado"
      });
      
      // Limpiar el input de archivo y cerrar el diálogo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowRestoreDialog(false);
      setBackupData(null);
      
      // Recargar la página después de una breve pausa
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Error al restaurar backup:", error);
      toast.error("Error al restaurar el backup", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Restaurar Backup
        </CardTitle>
        <CardDescription>
          Selecciona un archivo de backup para restaurar los datos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden" 
        />
        
        <div className="flex justify-center py-8 border-2 border-dashed rounded-md">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">Haz clic para seleccionar un archivo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              O arrastra y suelta un archivo JSON de backup
            </p>
            <Button 
              onClick={triggerFileUpload}
              disabled={isUploading}
              className="mt-4"
            >
              Seleccionar archivo
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isUploading && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">Restaurando backup...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <div className="text-sm text-muted-foreground mt-4">
          <p><strong>Nota:</strong> La restauración reemplazará todos los datos actuales por los del backup.</p>
          <p className="mt-1">Se recomienda crear un backup de los datos actuales antes de realizar una restauración.</p>
        </div>
        
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuración de restauración</DialogTitle>
              <DialogDescription>
                Seleccione el proyecto donde desea cargar los datos del backup
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="proyecto-destino">Proyecto destino</Label>
                <Select
                  value={targetProyectoId}
                  onValueChange={setTargetProyectoId}
                >
                  <SelectTrigger id="proyecto-destino">
                    <SelectValue placeholder="Seleccione proyecto destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Crear nuevo proyecto</SelectItem>
                    {proyectos.map(proyecto => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {targetProyectoId === "new" && (
                <div className="space-y-2">
                  <Label htmlFor="nuevo-proyecto">Nombre del nuevo proyecto</Label>
                  <Input
                    id="nuevo-proyecto"
                    value={newProyectoNombre}
                    onChange={(e) => setNewProyectoNombre(e.target.value)}
                    placeholder="Ej: Planta de Procesamiento"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRestoreBackup}>
                Restaurar datos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BackupRestoreUploader;
