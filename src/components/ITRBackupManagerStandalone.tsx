
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ITRBackupManager from "@/components/ITRBackupManager";
import ITRExcelImporter from "@/components/ITRExcelImporter";
import { FileSpreadsheet, Save, Upload, Database } from "lucide-react";

const ITRBackupManagerStandalone: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("backup");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Gestión de ITR</h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          Gestiona tus ITRs: haz copias de seguridad, reasigna a otros proyectos o importa desde Excel
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 w-full mb-8">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>Copia/Reasignación de ITR</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Importar desde Excel</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="backup" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestión de ITR
              </CardTitle>
              <CardDescription>
                Selecciona un ITR para respaldarlo o reasignarlo a otro proyecto o actividad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ITRBackupManager />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="mt-0">
          <ITRExcelImporter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ITRBackupManagerStandalone;
