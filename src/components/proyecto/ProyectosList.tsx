
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistance, format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import ProyectoForm from "./ProyectoForm";

const ProyectosList: React.FC = () => {
  const { proyectos, actividades, itrbItems, deleteProyecto } = useAppContext();
  
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [proyectoToEdit, setProyectoToEdit] = useState<string | null>(null);
  const [proyectoToDelete, setProyectoToDelete] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    toast.success("Proyecto creado con éxito");
  };
  
  const handleEditSuccess = () => {
    setProyectoToEdit(null);
    toast.success("Proyecto actualizado con éxito");
  };
  
  const handleDelete = () => {
    if (proyectoToDelete) {
      try {
        deleteProyecto(proyectoToDelete);
        toast.success("Proyecto eliminado con éxito");
      } catch (error: any) {
        toast.error(`Error al eliminar: ${error.message}`);
      }
      setProyectoToDelete(null);
    }
  };

  const canDeleteProyecto = (proyectoId: string) => {
    const actividadesCount = actividades.filter(a => a.proyectoId === proyectoId).length;
    const itrsCount = itrbItems.filter(i => i.proyectoId === proyectoId).length;
    return actividadesCount === 0 && itrsCount === 0;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Proyectos</CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <ProyectoForm
              onCancel={() => setIsCreateDialogOpen(false)}
              onSuccess={handleCreateSuccess}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {proyectos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay proyectos. Crea uno nuevo para comenzar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Última actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyectos.map((proyecto) => {
                const actividadesCount = actividades.filter(a => a.proyectoId === proyecto.id).length;
                const itrsCount = itrbItems.filter(i => i.proyectoId === proyecto.id).length;
                const fechaInicio = new Date(proyecto.fechaInicio);
                const fechaFin = new Date(proyecto.fechaFin);
                const fechaActualizacion = new Date(proyecto.fechaActualizacion);
                
                const duracion = formatDistance(fechaFin, fechaInicio, {
                  locale: es,
                  addSuffix: false,
                });
                
                return (
                  <TableRow key={proyecto.id}>
                    <TableCell className="font-medium">{proyecto.titulo}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {proyecto.descripcion || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{duracion}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {actividadesCount} actividades, {itrsCount} ITRs
                    </TableCell>
                    <TableCell>
                      {format(fechaActualizacion, "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog open={proyectoToEdit === proyecto.id} onOpenChange={(open) => {
                            if (!open) setProyectoToEdit(null);
                          }}>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={() => setProyectoToEdit(proyecto.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <ProyectoForm
                                proyectoId={proyecto.id}
                                onCancel={() => setProyectoToEdit(null)}
                                onSuccess={handleEditSuccess}
                              />
                            </DialogContent>
                          </Dialog>
                          <AlertDialog
                            open={proyectoToDelete === proyecto.id}
                            onOpenChange={(open) => {
                              if (!open) setProyectoToDelete(null);
                            }}
                          >
                            <DropdownMenuItem
                              onSelect={() => setProyectoToDelete(proyecto.id)}
                              disabled={!canDeleteProyecto(proyecto.id)}
                              className={!canDeleteProyecto(proyecto.id) ? "text-muted-foreground" : "text-red-500"}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente el proyecto "{proyecto.titulo}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ProyectosList;
