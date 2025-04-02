
import React from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProyectoSelector: React.FC = () => {
  const { proyectos, filtros, setFiltros } = useAppContext();

  // Si no hay proyectos aún, mostrar un proyecto de ejemplo
  const proyectosDisponibles = proyectos.length > 0 ? proyectos : [
    {
      id: "proyecto-ejemplo",
      titulo: "Proyecto Vaca Muerta",
      descripcion: "Proyecto de ejemplo",
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    }
  ];

  const handleProyectoChange = (proyectoId: string) => {
    setFiltros({ ...filtros, proyecto: proyectoId });
  };

  return (
    <Select
      value={filtros.proyecto}
      onValueChange={handleProyectoChange}
    >
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="Seleccionar proyecto" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos los proyectos</SelectItem>
        {proyectosDisponibles.map((proyecto) => (
          <SelectItem key={proyecto.id} value={proyecto.id}>
            {proyecto.titulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProyectoSelector;
