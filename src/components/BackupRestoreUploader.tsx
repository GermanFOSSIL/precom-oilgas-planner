
import React, { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackupOptions } from "@/types";

const BackupRestoreUploader = () => {
  const { 
    setProyectos, 
    setActividades, 
    setItrbItems, 
    setAlertas,
    updateKPIConfig 
  } = useAppContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
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
      let backupData;
      
      try {
        backupData = JSON.parse(fileContent);
      } catch (error) {
        setError("El archivo no contiene un formato JSON válido");
        clearInterval(progressInterval);
        setIsUploading(false);
        setProgress(0);
        return;
      }
      
      // Validar estructura mínima del backup
      if (!backupData || typeof backupData !== "object") {
        setError("El formato del backup es inválido");
        clearInterval(progressInterval);
        setIsUploading(false);
        setProgress(0);
        return;
      }
      
      // Restaurar datos
      if (backupData.proyectos && Array.isArray(backupData.proyectos)) {
        setProyectos(backupData.proyectos);
      }
      
      if (backupData.actividades && Array.isArray(backupData.actividades)) {
        setActividades(backupData.actividades);
      }
      
      if (backupData.itrbItems && Array.isArray(backupData.itrbItems)) {
        setItrbItems(backupData.itrbItems);
      }
      
      if (backupData.alertas && Array.isArray(backupData.alertas)) {
        setAlertas(backupData.alertas);
      }
      
      if (backupData.kpiConfig && typeof backupData.kpiConfig === "object") {
        updateKPIConfig(backupData.kpiConfig);
      }
      
      // Finalizar carga
      clearInterval(progressInterval);
      setProgress(100);
      
      // Mostrar mensaje de éxito
      toast.success("Backup restaurado exitosamente", {
        description: "Los datos han sido cargados en la aplicación"
      });
      
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        // Limpiar el input de archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Recargar la página después de una breve pausa para asegurar que 
        // todos los datos son cargados correctamente en la interfaz
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      }, 1000);
      
    } catch (error) {
      console.error("Error al restaurar backup:", error);
      setError(`Error al restaurar el backup: ${error instanceof Error ? error.message : "Error desconocido"}`);
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
      </CardContent>
    </Card>
  );
};

export default BackupRestoreUploader;
