
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Download } from "lucide-react";
import { BackupOptions } from "@/types";

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
    proyectos: true,
    actividades: true,
    itrbItems: true,
    alertas: true,
    kpiConfig: true
  });
  
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleBackupOptionChange = (key: keyof BackupOptions) => {
    setBackupOptions(prev => ({
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
      </CardContent>
    </Card>
  );
};

export default BackupRestoreManager;
