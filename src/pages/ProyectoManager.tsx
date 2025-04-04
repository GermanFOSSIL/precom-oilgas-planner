
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicHeader from "@/components/PublicHeader";
import ProyectosList from "@/components/proyecto/ProyectosList";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import ActividadForm from "@/components/actividad/ActividadForm";
import ITRForm from "@/components/itr/ITRForm";

const ProyectoManager: React.FC = () => {
  const { proyectoActual } = useAppContext();
  
  const [isCreateActividadOpen, setIsCreateActividadOpen] = useState(false);
  const [isCreateITROpen, setIsCreateITROpen] = useState(false);

  const handleCreateActividadSuccess = () => {
    setIsCreateActividadOpen(false);
  };

  const handleCreateITRSuccess = () => {
    setIsCreateITROpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Gestión de Proyectos</h1>
          <div className="flex gap-2">
            <Dialog open={isCreateActividadOpen} onOpenChange={setIsCreateActividadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Actividad
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <ActividadForm
                  defaultProyectoId={proyectoActual === "todos" ? undefined : proyectoActual}
                  onCancel={() => setIsCreateActividadOpen(false)}
                  onSuccess={handleCreateActividadSuccess}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateITROpen} onOpenChange={setIsCreateITROpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo ITR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <ITRForm
                  defaultProyectoId={proyectoActual === "todos" ? undefined : proyectoActual}
                  onCancel={() => setIsCreateITROpen(false)}
                  onSuccess={handleCreateITRSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="proyectos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
            <TabsTrigger value="actividades">Actividades</TabsTrigger>
            <TabsTrigger value="itrs">ITRs</TabsTrigger>
          </TabsList>

          <TabsContent value="proyectos">
            <ProyectosList />
          </TabsContent>

          <TabsContent value="actividades">
            <Card>
              <CardHeader>
                <CardTitle>Actividades</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Aquí se mostrarán las actividades</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itrs">
            <Card>
              <CardHeader>
                <CardTitle>ITRs</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Aquí se mostrarán los ITRs</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProyectoManager;
