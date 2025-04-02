
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Actividad } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ActividadModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  actividad?: Actividad;
  onSave: (actividad: Actividad) => void;
}> = ({ isOpen, setIsOpen, actividad, onSave }) => {
  const [formData, setFormData] = useState<Actividad>(
    actividad || {
      id: crypto.randomUUID(),
      nombre: "",
      sistema: "",
      subsistema: "",
      fechaInicio: "",
      fechaFin: "",
      duracion: 0
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "fechaInicio" || name === "fechaFin") {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        // Calcular duración si ambas fechas están presentes
        if (newData.fechaInicio && newData.fechaFin) {
          const start = new Date(newData.fechaInicio);
          const end = new Date(newData.fechaFin);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          newData.duracion = diffDays;
        }
        
        return newData;
      });
    } else if (name === "duracion") {
      setFormData(prev => {
        const duracion = parseInt(value) || 0;
        const newData = { ...prev, duracion };
        
        // Actualizar fecha de fin si hay fecha de inicio
        if (newData.fechaInicio) {
          const start = new Date(newData.fechaInicio);
          const end = new Date(start);
          end.setDate(start.getDate() + duracion);
          newData.fechaFin = end.toISOString().split('T')[0];
        }
        
        return newData;
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.sistema || !formData.subsistema || 
        !formData.fechaInicio || !formData.fechaFin) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }
    
    if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
      toast.error("La fecha de finalización debe ser posterior a la fecha de inicio");
      return;
    }
    
    onSave(formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {actividad ? "Editar actividad" : "Agregar nueva actividad"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-medium">
                Nombre de la Actividad
              </label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre de la actividad"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="sistema" className="text-sm font-medium">
                  Sistema
                </label>
                <Input
                  id="sistema"
                  name="sistema"
                  value={formData.sistema}
                  onChange={handleChange}
                  placeholder="Sistema"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subsistema" className="text-sm font-medium">
                  Subsistema
                </label>
                <Input
                  id="subsistema"
                  name="subsistema"
                  value={formData.subsistema}
                  onChange={handleChange}
                  placeholder="Subsistema"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="fechaInicio" className="text-sm font-medium">
                  Fecha de Inicio
                </label>
                <Input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fechaFin" className="text-sm font-medium">
                  Fecha de Finalización
                </label>
                <Input
                  id="fechaFin"
                  name="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="duracion" className="text-sm font-medium">
                  Duración (días)
                </label>
                <Input
                  id="duracion"
                  name="duracion"
                  type="number"
                  min="1"
                  value={formData.duracion}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-oilgas-primary hover:bg-oilgas-primary/90">
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ActividadesTable: React.FC = () => {
  const { actividades, addActividad, updateActividad, deleteActividad, isAdmin } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [currentActividad, setCurrentActividad] = useState<Actividad | undefined>(undefined);

  const handleEdit = (actividad: Actividad) => {
    setCurrentActividad(actividad);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar esta actividad? También se eliminarán los ITR B asociados.")) {
      deleteActividad(id);
      toast.success("Actividad eliminada correctamente");
    }
  };

  const handleSave = (actividad: Actividad) => {
    if (currentActividad) {
      updateActividad(currentActividad.id, actividad);
      toast.success("Actividad actualizada correctamente");
    } else {
      addActividad(actividad);
      toast.success("Actividad agregada correctamente");
    }
    setCurrentActividad(undefined);
  };

  const handleAddNew = () => {
    setCurrentActividad(undefined);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Actividades del cronograma
        </h2>
        {isAdmin && (
          <Button
            onClick={handleAddNew}
            className="bg-oilgas-primary hover:bg-oilgas-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar actividad
          </Button>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Subsistema</TableHead>
              <TableHead>Fecha de Inicio</TableHead>
              <TableHead>Fecha de Finalización</TableHead>
              <TableHead>Duración (días)</TableHead>
              {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {actividades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-10 text-muted-foreground">
                  No hay actividades registradas
                </TableCell>
              </TableRow>
            ) : (
              actividades.map((actividad) => (
                <TableRow key={actividad.id}>
                  <TableCell className="font-mono text-xs">{actividad.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{actividad.nombre}</TableCell>
                  <TableCell>{actividad.sistema}</TableCell>
                  <TableCell>{actividad.subsistema}</TableCell>
                  <TableCell>{new Date(actividad.fechaInicio).toLocaleDateString("es-ES")}</TableCell>
                  <TableCell>{new Date(actividad.fechaFin).toLocaleDateString("es-ES")}</TableCell>
                  <TableCell>{actividad.duracion}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(actividad)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(actividad.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <ActividadModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        actividad={currentActividad}
        onSave={handleSave}
      />
    </div>
  );
};

export default ActividadesTable;
