
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Download, Check } from "lucide-react";
import { BackupOptions } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BackupRestoreManager = () => {
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
  
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeProyectos: true,
    includeActividades: true,
    includeITRB: true,
    includeAlertas: true,
    includeKpiConfig: true
  });
  
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [backupCreated, setBackupCreated] = useState(false);
  
  const handleBackupOptionChange = (key: keyof BackupOptions) => {
    setBackupOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const createBackup = async () => {
    try {
      setBackupCreated(false);
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
      
      if (backupOptions.includeProyectos) {
        backupData.proyectos = proyectos;
      }
      
      if (backupOptions.includeActividades) {
        backupData.actividades = actividades;
      }
      
      if (backupOptions.includeITRB) {
        backupData.itrbItems = itrbItems;
      }
      
      if (backupOptions.includeAlertas) {
        backupData.alertas = alertas;
      }
      
      if (backupOptions.includeKpiConfig) {
        backupData.kpiConfig = kpiConfig;
      }
      
      backupData.metadata = {
        fecha: new Date().toISOString(),
        version: "1.0.0",
        timestamp: Date.now(),
        opciones: backupOptions
      };
      
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
      link.download = `backup-proyectos-${formattedDate}-${formattedTime}.json`;
      
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Backup creado exitosamente", {
          description: "El archivo se ha descargado automáticamente"
        });
        
        setBackupCreated(true);
        
        setTimeout(() => {
          setIsExporting(false);
        }, 1000);
      }, 800);
      
      // Asegurar que se libere la URL del objeto
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
      
    } catch (error) {
      console.error("Error al crear backup:", error);
      toast.error("Error al crear backup", {
        description: "No se pudo completar la operación"
      });
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Crear Backup
        </CardTitle>
        <CardDescription>
          Selecciona los datos que deseas incluir en el backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opciones de Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="proyectos-backup" 
                  checked={backupOptions.includeProyectos}
                  onCheckedChange={() => handleBackupOptionChange('includeProyectos')}
                />
                <Label htmlFor="proyectos-backup">Proyectos ({proyectos.length})</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="actividades-backup" 
                  checked={backupOptions.includeActividades}
                  onCheckedChange={() => handleBackupOptionChange('includeActividades')}
                />
                <Label htmlFor="actividades-backup">Actividades ({actividades.length})</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="itrbs-backup" 
                  checked={backupOptions.includeITRB}
                  onCheckedChange={() => handleBackupOptionChange('includeITRB')}
                />
                <Label htmlFor="itrbs-backup">ITR B ({itrbItems.length})</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="alertas-backup" 
                  checked={backupOptions.includeAlertas}
                  onCheckedChange={() => handleBackupOptionChange('includeAlertas')}
                />
                <Label htmlFor="alertas-backup">Alertas ({alertas.length})</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="config-backup" 
                  checked={backupOptions.includeKpiConfig}
                  onCheckedChange={() => handleBackupOptionChange('includeKpiConfig')}
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
                <p className="text-muted-foreground">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              </div>
              
              <div className="text-sm">
                <p className="font-medium">Total de elementos:</p>
                <p className="text-muted-foreground">
                  {(backupOptions.includeProyectos ? proyectos.length : 0) +
                   (backupOptions.includeActividades ? actividades.length : 0) +
                   (backupOptions.includeITRB ? itrbItems.length : 0) +
                   (backupOptions.includeAlertas ? alertas.length : 0) +
                   (backupOptions.includeKpiConfig ? 1 : 0)}
                </p>
              </div>
              
              <div className="text-sm">
                <p className="font-medium">Versión:</p>
                <p className="text-muted-foreground">1.0.0</p>
              </div>
              
              <Button 
                onClick={createBackup} 
                disabled={
                  isExporting || 
                  !Object.values(backupOptions).some(val => val === true)
                }
                className="w-full mt-4 gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar Backup
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {isExporting && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">Generando archivo de backup...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {backupCreated && !isExporting && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Backup generado correctamente</AlertTitle>
            <AlertDescription className="text-green-600">
              El archivo de backup se ha descargado en tu dispositivo. Guárdalo en un lugar seguro.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupRestoreManager;
