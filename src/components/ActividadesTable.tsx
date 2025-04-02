import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Edit, Trash, Plus } from "lucide-react";
import { Actividad } from "@/types";

const ActividadesTable: React.FC = () => {
  const { actividades, addActividad, updateActividad, deleteActividad, filtros, proyectoActual } = useAppContext();
  
  // Filtrar actividades según los filtros aplicados
  const actividadesFiltradas = actividades.filter(actividad => {
    // Filtrar por proyecto si no es "todos"
    if (filtros.proyecto !== "todos" && actividad.proyectoId !== filtros.proyecto) {
      return false;
    }
    
    // Filtrar por sistema si está seleccionado
    if (filtros.sistema && filtros.sistema !== "todos" && actividad.sistema !== filtros.sistema) {
      return false;
    }
    
    // Filtrar por subsistema si está seleccionado
    if (filtros.subsistema && filtros.subsistema !== "todos" && actividad.subsistema !== filtros.subsistema) {
      return false;
    }
    
    // Filtrar por texto de búsqueda
    if (filtros.busquedaActividad && !actividad.nombre.toLowerCase().includes(filtros.busquedaActividad.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Función para agregar una nueva actividad (ejemplo)
  const handleAddActividad = () => {
    // Esta es la manera correcta de crear una nueva actividad, asegurándose de que tenga todos los campos requeridos
    const nuevaActividad: Actividad = {
      id: `actividad-${Date.now()}`,
      proyectoId: proyectoActual !== "todos" ? proyectoActual : "", // Este campo es obligatorio
      nombre: "Nueva actividad",
      sistema: "Sistema ejemplo",
      subsistema: "Subsistema ejemplo",
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duracion: 7
    };
    
    addActividad(nuevaActividad);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Sistema</TableHead>
            <TableHead>Subsistema</TableHead>
            <TableHead>Fecha Inicio</TableHead>
            <TableHead>Fecha Fin</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actividadesFiltradas.length > 0 ? (
            actividadesFiltradas.map((actividad) => (
              <TableRow key={actividad.id}>
                <TableCell className="font-medium">{actividad.id.substring(0, 8)}...</TableCell>
                <TableCell>{actividad.nombre}</TableCell>
                <TableCell>{actividad.sistema}</TableCell>
                <TableCell>{actividad.subsistema}</TableCell>
                <TableCell>{new Date(actividad.fechaInicio).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(actividad.fechaFin).toLocaleDateString()}</TableCell>
                <TableCell>{actividad.duracion} días</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                No hay actividades disponibles para los filtros seleccionados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ActividadesTable;
