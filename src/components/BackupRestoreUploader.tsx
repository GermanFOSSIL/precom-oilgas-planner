import React, { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Upload } from "lucide-react";
import { BackupOptions } from "@/types";

const BackupRestoreUploader = () => {
  const context = useAppContext();
  
  const {
    proyectos,
    actividades,
    itrbItems,
    alertas,
    kpiConfig
  } = context;
  
  const setProyectos = context.setProyectos || function() { 
    console.error("setProyectos is not available");
    toast.error("Error: No se puede restaurar proyectos");
  };
  
  const setActividades = context.setActividades || function() {
    console.error("setActividades is not available");
    toast.error("Error: No se puede restaurar actividades");
  };
  
  const setItrbItems = context.setItrbItems || function() {
    console.error("setItrbItems is not available");
    toast.error("Error: No se puede restaurar ITRBs");
  };
  
  const setAlertas = context.setAlertas || function() {
    console.error("setAlertas is not available");
    toast.error("Error: No se puede restaurar alertas");
  };
  
  const updateKPIConfig = context.updateKPIConfig || function() {
    console.error("updateKPIConfig is not available");
    toast.error("Error: No se puede restaurar configuración de KPIs");
  };
  
  const [restoreOptions, setRestoreOptions] = useState<BackupOptions>({
    proyectos: true,
    actividades: true,
    itrbItems: true,
    alertas: true,
    kpiConfig: true
  });
  
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [backupMetadata, setBackupMetadata] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRestoreOptionChange = (key: keyof BackupOptions) => {
    setRestoreOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (file.name.toLowerCase().endsWith('.json')) {
        setBackupFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            if (e.target?.result) {
              const data = JSON.parse(e.target.result as string);
              if (data && data.metadata) {
                setBackupMetadata(data.metadata);
                setDialogOpen(true);
              } else {
                toast.error("El archivo no contiene metadatos válidos");
              }
            }
          } catch (error) {
            console.error("Error al previsualizar archivo:", error);
            toast.error("Error al leer el archivo", {
              description: "El formato del archivo no es válido"
            });
          }
        };
        reader.readAsText(file);
      } else {
        toast.error("Formato de archivo no válido", {
          description: "Por favor seleccione un archivo .json"
        });
        
        event.target.value = '';
        setBackupFile(null);
      }
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setBackupFile(null);
    setBackupMetadata(null);
  };

  const restoreBackup = async () => {
    if (!backupFile) {
      toast.error("No se ha seleccionado ningún archivo");
      return;
    }

    try {
      setIsImporting(true);
      setProgress(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 50);

      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          try {
            let data;
            try {
              data = JSON.parse(e.target.result as string);
            } catch (parseError) {
              console.error("Error al analizar JSON:", parseError);
              throw new Error("Error al analizar el archivo JSON. El formato del archivo no es válido.");
            }
            
            if (!data || !data.metadata) {
              throw new Error("El archivo seleccionado no es un backup válido. No se encontraron metadatos.");
            }
            
            console.log("Datos de backup leídos correctamente:", Object.keys(data));
            
            if (restoreOptions.proyectos && data.proyectos && typeof setProyectos === 'function') {
              try {
                console.log("Restaurando proyectos:", data.proyectos.length);
                setProyectos(data.proyectos);
              } catch (error) {
                console.error("Error al restaurar proyectos:", error);
                toast.error("Error al restaurar proyectos");
              }
            }
            
            if (restoreOptions.actividades && data.actividades && typeof setActividades === 'function') {
              try {
                console.log("Restaurando actividades:", data.actividades.length);
                setActividades(data.actividades);
              } catch (error) {
                console.error("Error al restaurar actividades:", error);
                toast.error("Error al restaurar actividades");
              }
            }
            
            if (restoreOptions.itrbItems && data.itrbItems && typeof setItrbItems === 'function') {
              try {
                console.log("Restaurando ITRBs:", data.itrbItems.length);
                setItrbItems(data.itrbItems);
              } catch (error) {
                console.error("Error al restaurar ITRBs:", error);
                toast.error("Error al restaurar ITRBs");
              }
            }
            
            if (restoreOptions.alertas && data.alertas && typeof setAlertas === 'function') {
              try {
                console.log("Restaurando alertas:", data.alertas.length);
                setAlertas(data.alertas);
              } catch (error) {
                console.error("Error al restaurar alertas:", error);
                toast.error("Error al restaurar alertas");
              }
            }
            
            if (restoreOptions.kpiConfig && data.kpiConfig && typeof updateKPIConfig === 'function') {
              try {
                console.log("Restaurando configuración de KPIs");
                updateKPIConfig(data.kpiConfig);
              } catch (error) {
                console.error("Error al restaurar configuración de KPIs:", error);
                toast.error("Error al restaurar configuración de KPIs");
              }
            }
            
            setTimeout(() => {
              clearInterval(progressInterval);
              setProgress(100);
              
              toast.success("Backup restaurado exitosamente", {
                description: `Datos importados con fecha ${new Date(data.metadata.fecha).toLocaleDateString()}`
              });
              
              setTimeout(() => {
                setIsImporting(false);
                setProgress(0);
                setBackupFile(null);
                setDialogOpen(false);
                resetFileInput();
              }, 500);
            }, 800);
            
          } catch (error) {
            console.error("Error al procesar el archivo:", error);
            toast.error("Error al procesar el archivo", {
              description: error instanceof Error ? error.message : "El formato del archivo no es válido"
            });
            setIsImporting(false);
            setProgress(0);
            resetFileInput();
          }
        }
      };
      
      reader.onerror = (error) => {
        console.error("Error al leer el archivo:", error);
        toast.error("Error al leer el archivo", {
          description: "No se pudo leer el contenido del archivo"
        });
        setIsImporting(false);
        setProgress(0);
        resetFileInput();
      };
      
      reader.readAsText(backupFile);
      
    } catch (error) {
      console.error("Error al restaurar backup:", error);
      toast.error("Error al restaurar backup", {
        description: "No se pudo completar la operación"
      });
      setIsImporting(false);
      setProgress(0);
      resetFileInput();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArchiveRestore className="h-5 w-5" />
          Restaurar Backup
        </CardTitle>
        <CardDescription>
          Selecciona un archivo de backup para restaurar tus datos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg">
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted/30">
            <ArchiveRestore className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <div className="flex flex-col items-center text-center">
            <h3 className="font-semibold">Selecciona un archivo de backup</h3>
            <p className="text-sm text-muted-foreground">
              Formato: .json - Arrastra y suelta o haz clic para explorar
            </p>
          </div>
          
          <label 
            htmlFor="backup-file" 
            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Seleccionar archivo
          </label>
          <input
            id="backup-file"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {backupFile && (
            <div className="flex items-center gap-2 text-sm">
              <Archive className="h-4 w-4" />
              <span>{backupFile.name}</span>
            </div>
          )}
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restaurar desde backup</DialogTitle>
              <DialogDescription>
                Selecciona los datos que deseas restaurar desde el archivo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {backupMetadata && (
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Información del backup:</p>
                  <p className="text-sm">Fecha: {new Date(backupMetadata.fecha).toLocaleDateString()}</p>
                  <p className="text-sm">Versión: {backupMetadata.version}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="proyectos-restore" 
                  checked={restoreOptions.proyectos}
                  onCheckedChange={() => handleRestoreOptionChange('proyectos')}
                />
                <Label htmlFor="proyectos-restore">Proyectos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="actividades-restore" 
                  checked={restoreOptions.actividades}
                  onCheckedChange={() => handleRestoreOptionChange('actividades')}
                />
                <Label htmlFor="actividades-restore">Actividades</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="itrbs-restore" 
                  checked={restoreOptions.itrbItems}
                  onCheckedChange={() => handleRestoreOptionChange('itrbItems')}
                />
                <Label htmlFor="itrbs-restore">ITR B</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="alertas-restore" 
                  checked={restoreOptions.alertas}
                  onCheckedChange={() => handleRestoreOptionChange('alertas')}
                />
                <Label htmlFor="alertas-restore">Alertas</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="config-restore" 
                  checked={restoreOptions.kpiConfig}
                  onCheckedChange={() => handleRestoreOptionChange('kpiConfig')}
                />
                <Label htmlFor="config-restore">Configuración de KPIs</Label>
              </div>
              
              {isImporting && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium">Importando datos...</p>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetFileInput();
              }} disabled={isImporting}>
                Cancelar
              </Button>
              <Button 
                onClick={restoreBackup} 
                disabled={!backupFile || isImporting}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Restaurar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BackupRestoreUploader;
