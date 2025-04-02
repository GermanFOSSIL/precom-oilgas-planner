
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { ITRB, EstadoITRB } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const getBadgeColorByEstado = (estado: EstadoITRB) => {
  switch (estado) {
    case "Completado":
      return "bg-estado-completado";
    case "En curso":
      return "bg-estado-curso";
    case "Vencido":
      return "bg-estado-vencido";
    default:
      return "";
  }
};

const ITRBModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  itrb?: ITRB;
  onSave: (itrb: ITRB) => void;
}> = ({ isOpen, setIsOpen, itrb, onSave }) => {
  const { actividades } = useAppContext();
  const [formData, setFormData] = useState<ITRB>(
    itrb || {
      id: crypto.randomUUID(),
      actividadId: actividades[0]?.id || "",
      descripcion: "",
      cantidadTotal: 1,
      cantidadRealizada: 0,
      fechaLimite: "",
      estado: "En curso",
      ccc: false
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "cantidadTotal" || name === "cantidadRealizada") {
      const numValue = parseInt(value) || 0;
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.actividadId || !formData.descripcion || !formData.fechaLimite) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }
    
    if (formData.cantidadTotal < 1) {
      toast.error("La cantidad total debe ser al menos 1");
      return;
    }
    
    if (formData.cantidadRealizada > formData.cantidadTotal) {
      toast.error("La cantidad realizada no puede ser mayor que la cantidad total");
      return;
    }
    
    // Calcular estado
    let estado: EstadoITRB = "En curso";
    if (formData.cantidadRealizada >= formData.cantidadTotal) {
      estado = "Completado";
    } else if (new Date(formData.fechaLimite) < new Date()) {
      estado = "Vencido";
    }
    
    onSave({ ...formData, estado });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {itrb ? "Editar ITR B" : "Agregar nuevo ITR B"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor="actividadId" className="text-sm font-medium">
                Actividad Asociada
              </label>
              <Select
                value={formData.actividadId}
                onValueChange={(value) => setFormData({ ...formData, actividadId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una actividad" />
                </SelectTrigger>
                <SelectContent>
                  {actividades.map((actividad) => (
                    <SelectItem key={actividad.id} value={actividad.id}>
                      {actividad.nombre} ({actividad.sistema} - {actividad.subsistema})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="descripcion" className="text-sm font-medium">
                Descripción
              </label>
              <Input
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción del ITR B"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="cantidadTotal" className="text-sm font-medium">
                  Cantidad Total
                </label>
                <Input
                  id="cantidadTotal"
                  name="cantidadTotal"
                  type="number"
                  min="1"
                  value={formData.cantidadTotal}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cantidadRealizada" className="text-sm font-medium">
                  Cantidad Realizada
                </label>
                <Input
                  id="cantidadRealizada"
                  name="cantidadRealizada"
                  type="number"
                  min="0"
                  value={formData.cantidadRealizada}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="fechaLimite" className="text-sm font-medium">
                Fecha Límite de Ejecución
              </label>
              <Input
                id="fechaLimite"
                name="fechaLimite"
                type="date"
                value={formData.fechaLimite}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ccc"
                checked={formData.ccc}
                onCheckedChange={(checked) => setFormData({ ...formData, ccc: checked })}
              />
              <label htmlFor="ccc" className="text-sm font-medium">
                CCC (Control de Calidad del Contratista)
              </label>
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

const ITRBTable: React.FC = () => {
  const { actividades, itrbItems, addITRB, updateITRB, deleteITRB, isAdmin } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [currentITRB, setCurrentITRB] = useState<ITRB | undefined>(undefined);

  const handleEdit = (itrb: ITRB) => {
    setCurrentITRB(itrb);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este ITR B?")) {
      deleteITRB(id);
      toast.success("ITR B eliminado correctamente");
    }
  };

  const handleSave = (itrb: ITRB) => {
    if (currentITRB) {
      updateITRB(currentITRB.id, itrb);
      toast.success("ITR B actualizado correctamente");
    } else {
      addITRB(itrb);
      toast.success("ITR B agregado correctamente");
    }
    setCurrentITRB(undefined);
  };

  const handleAddNew = () => {
    setCurrentITRB(undefined);
    setIsOpen(true);
  };

  const getActividadDetails = (actividadId: string) => {
    const actividad = actividades.find(act => act.id === actividadId);
    return {
      nombre: actividad?.nombre || "Desconocido",
      sistema: actividad?.sistema || "Desconocido",
      subsistema: actividad?.subsistema || "Desconocido"
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Items ITR B
        </h2>
        {isAdmin && (
          <Button
            onClick={handleAddNew}
            className="bg-oilgas-primary hover:bg-oilgas-primary/90"
            disabled={actividades.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar ITR B
          </Button>
        )}
      </div>
      
      {actividades.length === 0 && (
        <div className="border rounded-lg p-4 text-center text-muted-foreground bg-muted/20">
          Primero debe agregar actividades para poder crear ITR B
        </div>
      )}
      
      {actividades.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Descripción</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead>Sistema - Subsistema</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>CCC</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {itrbItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-10 text-muted-foreground">
                    No hay ITR B registrados
                  </TableCell>
                </TableRow>
              ) : (
                itrbItems.map((itrb) => {
                  const actividadDetails = getActividadDetails(itrb.actividadId);
                  const progreso = (itrb.cantidadRealizada / itrb.cantidadTotal) * 100;
                  return (
                    <TableRow key={itrb.id}>
                      <TableCell className="font-medium">
                        {itrb.descripcion}
                        {itrb.estado === "Vencido" && (
                          <span className="ml-2 text-estado-vencido inline-flex items-center">
                            <AlertCircle className="h-4 w-4" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{actividadDetails.nombre}</TableCell>
                      <TableCell>
                        {actividadDetails.sistema} - {actividadDetails.subsistema}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${getBadgeColorByEstado(itrb.estado)}`}
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                          <span>{itrb.cantidadRealizada}/{itrb.cantidadTotal}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(itrb.fechaLimite).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>
                        <Badge className={getBadgeColorByEstado(itrb.estado)}>
                          {itrb.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{itrb.ccc ? "Sí" : "No"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(itrb)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(itrb.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      <ITRBModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        itrb={currentITRB}
        onSave={handleSave}
      />
    </div>
  );
};

export default ITRBTable;
