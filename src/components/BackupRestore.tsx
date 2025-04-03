import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Archive, ArchiveRestore, Database, Download, Upload } from "lucide-react";

interface BackupData {
  proyectos?: boolean;
  actividades?: boolean;
  itrbItems?: boolean;
  alertas?: boolean;
  kpiConfig?: boolean;
}

const BackupRestore = () => {
  const { 
    proyectos, 
    actividades, 
    itrbItems, 
    alertas, 
    kpiConfig,
    setProyectos,
    setActividades,
    setItrbItems,
    setAlertas,
    updateKPIConfig
  } = useAppContext();
  
  const [backupOptions, setBackupOptions] = useState<BackupData>({
    proyectos: true,
    actividades: true,
    itrbItems: true,
    alertas: true,
    kpiConfig: true
  });
  
  const [restoreOptions, setRestoreOptions] = useState<BackupData>({
    proyectos: true,
    actividades: true,
    itrbItems: true,
    alertas: true,
    kpiConfig: true
  });
  
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBackupOptionChange = (key: keyof BackupData) => {
    setBackupOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRestoreOptionChange = (key: keyof BackupData) => {
    setRestoreOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const createBackup = async () => {
    try {
      setIsExporting(true);
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
      
      const backupData: any = {};
      
      if (backupOptions.proyectos) {
        backupData.proyectos = proyectos;
      }
      
      if (backupOptions.actividades) {
        backupData.actividades = actividades;
      }
      
      if (backupOptions.itrbItems) {
        backupData.itrbItems = itrbItems;
      }
      
      if (backupOptions.alertas) {
        backupData.alertas = alertas;
      }
      
      if (backupOptions.kpiConfig) {
        backupData.kpiConfig = kpiConfig;
      }
      
      backupData.metadata = {
        fecha: new Date().toISOString(),
        version: "1.0.0",
        opciones: backupOptions
      };
      
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      link.download = `backup-proyectos-${formattedDate}.json`;
      
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Backup creado exitosamente", {
          description: "El archivo se ha descargado automáticamente"
        });
        
        setTimeout(() => {
          setIsExporting(false);
          setProgress(0);
        }, 500);
      }, 800);
      
    } catch (error) {
      console.error("Error al crear backup:", error);
      toast.error("Error al crear backup", {
        description: "No se pudo completar la operación"
      });
      setIsExporting(false);
      setProgress(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      const isJsonExtension = file.name.toLowerCase().endsWith('.json');
      const isJsonType = file.type === 'application/json' || file.type === '';
      
      if (isJsonExtension || isJsonType) {
        setBackupFile(file);
      } else {
        toast.error("Formato de archivo no válido", {
          description: "Por favor seleccione un archivo .json"
        });
        
        event.target.value = '';
      }
    }
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
              throw new Error("Error al analizar el archivo JSON. El formato del archivo no es válido.");
            }
            
            if (!data.metadata) {
              throw new Error("El archivo seleccionado no es un backup válido. No se encontraron metadatos.");
            }
            
            if (restoreOptions.proyectos && data.proyectos) {
              setProyectos(data.proyectos);
            }
            
            if (restoreOptions.actividades && data.actividades) {
              setActividades(data.actividades);
            }
            
            if (restoreOptions.itrbItems && data.itrbItems) {
              setItrbItems(data.itrbItems);
            }
            
            if (restoreOptions.alertas && data.alertas) {
              setAlertas(data.alertas);
            }
            
            if (restoreOptions.kpiConfig && data.kpiConfig) {
              updateKPIConfig(data.kpiConfig);
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
                setOpen(false);
                
                const fileInput = document.getElementById('backup-file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }, 500);
            }, 800);
            
          } catch (error) {
            console.error("Error al procesar el archivo:", error);
            toast.error("Error al procesar el archivo", {
              description: error instanceof Error ? error.message : "El formato del archivo no es válido"
            });
            setIsImporting(false);
            setProgress(0);
            
            const fileInput = document.getElementById('backup-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        toast.error("Error al leer el archivo", {
          description: "No se pudo leer el contenido del archivo"
        });
        setIsImporting(false);
        setProgress(0);
      };
      
      reader.readAsText(backupFile);
      
    } catch (error) {
      console.error("Error al restaurar backup:", error);
      toast.error("Error al restaurar backup", {
        description: "No se pudo completar la operación"
      });
      setIsImporting(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup y Restauración
        </CardTitle>
        <CardDescription>
          Crea copias de seguridad de tus proyectos y restaura datos desde un archivo de backup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Crear Backup
            </TabsTrigger>
            <TabsTrigger value="restore" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Restaurar Backup
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Opciones de Backup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="proyectos-backup" 
                      checked={backupOptions.proyectos}
                      onCheckedChange={() => handleBackupOptionChange('proyectos')}
                    />
                    <Label htmlFor="proyectos-backup">Proyectos ({proyectos.length})</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="actividades-backup" 
                      checked={backupOptions.actividades}
                      onCheckedChange={() => handleBackupOptionChange('actividades')}
                    />
                    <Label htmlFor="actividades-backup">Actividades ({actividades.length})</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="itrbs-backup" 
                      checked={backupOptions.itrbItems}
                      onCheckedChange={() => handleBackupOptionChange('itrbItems')}
                    />
                    <Label htmlFor="itrbs-backup">ITR B ({itrbItems.length})</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="alertas-backup" 
                      checked={backupOptions.alertas}
                      onCheckedChange={() => handleBackupOptionChange('alertas')}
                    />
                    <Label htmlFor="alertas-backup">Alertas ({alertas.length})</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="config-backup" 
                      checked={backupOptions.kpiConfig}
                      onCheckedChange={() => handleBackupOptionChange('kpiConfig')}
                    />
                    <Label htmlFor="config-backup">Configuración de KPIs</Label>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información del Backup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="font-medium">Fecha de creación:</p>
                    <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium">Total de elementos:</p>
                    <p className="text-muted-foreground">
                      {(backupOptions.proyectos ? proyectos.length : 0) +
                       (backupOptions.actividades ? actividades.length : 0) +
                       (backupOptions.itrbItems ? itrbItems.length : 0) +
                       (backupOptions.alertas ? alertas.length : 0) +
                       (backupOptions.kpiConfig ? 1 : 0)}
                    </p>
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium">Versión:</p>
                    <p className="text-muted-foreground">1.0.0</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {isExporting && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Generando archivo de backup...</p>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-4 pt-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <div className="space-y-4">
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
                
                {backupFile && (
                  <DialogTrigger asChild>
                    <Button className="w-full">Continuar con la restauración</Button>
                  </DialogTrigger>
                )}
              </div>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Restaurar desde backup</DialogTitle>
                  <DialogDescription>
                    Selecciona los datos que deseas restaurar desde el archivo
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
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
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
                    Cancelar
                  </Button>
                  <FormSubmitButton 
                    onClick={restoreBackup} 
                    disabled={!backupFile || isImporting}
                    className="gap-2"
                  >
                    Restaurar
                  </FormSubmitButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end pt-0">
        {
          /* 
          Solo mostrar botón de backup en la pestaña correspondiente, 
          el de restore se maneja mediante Dialog 
          */
        }
        <TabsContent value="backup" className="mt-0 pt-0 w-full flex justify-end">
          <Button 
            onClick={createBackup} 
            disabled={
              isExporting || 
              !Object.values(backupOptions).some(val => val === true)
            }
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Backup
          </Button>
        </TabsContent>
      </CardFooter>
    </Card>
  );
};

export default BackupRestore;
