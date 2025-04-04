
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, Upload } from "lucide-react";
import BackupRestoreManager from "./BackupRestoreManager";
import BackupRestoreUploader from "./BackupRestoreUploader";
import ITRBackupManager from "./ITRBackupManager";

const BackupRestore = () => {
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Crear Backup
            </TabsTrigger>
            <TabsTrigger value="restore" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Restaurar Backup
            </TabsTrigger>
            <TabsTrigger value="itr-manager" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Gestión de ITR
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-4 pt-4">
            <BackupRestoreManager />
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-4 pt-4">
            <BackupRestoreUploader />
          </TabsContent>
          
          <TabsContent value="itr-manager" className="space-y-4 pt-4">
            <ITRBackupManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BackupRestore;
