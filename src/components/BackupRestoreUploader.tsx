import React, { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackupOptions, Proyecto, Alerta } from "@/types";
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
    itrbItems,
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
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
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
      
      if (!isValidBackupData(parsedData)) {
        setError("El formato del backup es inválido o no contiene los datos necesarios");
        clearInterval(progressInterval);
        setIsUploading(false);
        setProgress(0);
        return;
      }
      
      setBackupData(parsedData);
      
      if (parsedData.proyectos && Array.isArray(parsedData.proyectos) && parsedData.proyectos.length > 0) {
        setNewProyectoNombre(parsedData.proyectos[0].titulo);
      }
      
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
  
  const isValidBackupData = (data: any): boolean => {
    if (!data || typeof data !== "object") return false;
    
    const hasProyectos = Array.isArray(data.proyectos);
    const hasActividades = Array.isArray(data.actividades);
    const hasItrbItems = Array.isArray(data.itrbItems);
    
    return hasProyectos || hasActividades || hasItrbItems;
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
      let nuevoProyecto: Proyecto | null = null;
      
      if (targetProyectoId === "new") {
        if (!newProyectoNombre.trim()) {
          toast.error("Debe ingresar un nombre para el nuevo proyecto");
          return;
        }
        
        const now = new Date().toISOString();
        nuevoProyecto = {
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
      
      if (backupData.proyectos && Array.isArray(backupData.proyectos)) {
        if (targetProyectoId === "new") {
          const existingProjectIds = new Set(proyectos.map(p => p.id));
          const newProjects = backupData.proyectos.filter(p => !existingProjectIds.has(p.id));
          
          if (nuevoProyecto) {
            setProyectos([...proyectos, nuevoProyecto]);
          } else {
            setProyectos([...proyectos, ...newProjects]);
          }
        }
      }
      
      let nuevasActividades = [...actividades];
      
      if (backupData.actividades && Array.isArray(backupData.actividades)) {
        const actividadesModificadas = [...backupData.actividades];
        
        if (backupData.proyectos && backupData.proyectos.length > 0) {
          const proyectoOriginalId = backupData.proyectos[0].id;
          
          actividadesModificadas.forEach(act => {
            if (act.proyectoId === proyectoOriginalId) {
              act.proyectoId = targetProyectoIdToUse;
            }
          });
        }
        
        const existingActivityIds = new Set(actividades.map(a => a.id));
        const newActivities = actividadesModificadas.filter(a => !existingActivityIds.has(a.id));
        
        nuevasActividades = [...actividades, ...newActivities];
        setActividades(nuevasActividades);
      }
      
      let nuevosITRBs = [...itrbItems];
      
      if (backupData.itrbItems && Array.isArray(backupData.itrbItems)) {
        const existingItrbIds = new Set(itrbItems.map(i => i.id));
        const newItrbs = backupData.itrbItems.filter(i => !existingItrbIds.has(i.id));
        
        if (backupData.proyectos && backupData.proyectos.length > 0 && targetProyectoId === "new") {
          const originalProyectoId = backupData.proyectos[0].id;
          
          const actividadMapping = new Map();
          backupData.actividades.forEach((origAct: any) => {
            if (origAct.proyectoId === originalProyectoId) {
              const newAct = nuevasActividades.find(
                a => a.nombre === origAct.nombre && 
                     a.sistema === origAct.sistema && 
                     a.subsistema === origAct.subsistema && 
                     a.proyectoId === targetProyectoIdToUse
              );
              if (newAct) {
                actividadMapping.set(origAct.id, newAct.id);
              }
            }
          });
          
          newItrbs.forEach(itrb => {
            if (actividadMapping.has(itrb.actividadId)) {
              itrb.actividadId = actividadMapping.get(itrb.actividadId);
            }
          });
        }
        
        const processedItrbs = newItrbs.map(itrb => ({
          ...itrb,
          fechaCreacion: typeof itrb.fechaCreacion === 'number' 
            ? new Date(itrb.fechaCreacion).toISOString() 
            : itrb.fechaCreacion,
          fechaLimite: typeof itrb.fechaLimite === 'number' 
            ? new Date(itrb.fechaLimite).toISOString() 
            : itrb.fechaLimite
        }));
        
        nuevosITRBs = [...itrbItems, ...processedItrbs];
        setItrbItems(nuevosITRBs);
      }
      
      if (backupData.alertas && Array.isArray(backupData.alertas)) {
        const existingAlertaIds = new Set(backupData.alertas.map((a: any) => a.id));
        const newAlertas = backupData.alertas.filter((a: any) => !existingAlertaIds.has(a.id));
        
        const updatedAlertas = [...newAlertas] as Alerta[];
        setAlertas(updatedAlertas);
      }
      
      if (backupData.kpiConfig && typeof backupData.kpiConfig === "object") {
        updateKPIConfig(backupData.kpiConfig);
      }
      
      toast.success("Backup restaurado exitosamente", {
        description: targetProyectoId === "new" 
          ? `Se ha creado un nuevo proyecto: ${newProyectoNombre}` 
          : "Los datos han sido cargados en el proyecto seleccionado"
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowRestoreDialog(false);
      setBackupData(null);
      
      localStorage.setItem("proyectos", JSON.stringify(nuevoProyecto ? [...proyectos, nuevoProyecto] : proyectos));
      localStorage.setItem("actividades", JSON.stringify(nuevasActividades));
      localStorage.setItem("itrbItems", JSON.stringify(nuevosITRBs));
      
      setTimeout(() => {
        localStorage.setItem("timestamp", Date.now().toString());
        window.location.reload();
      }, 3000);
      
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
