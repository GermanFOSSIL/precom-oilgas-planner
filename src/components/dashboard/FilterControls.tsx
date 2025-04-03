
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterControlsProps {
  filtros: FiltrosDashboard;
  onFiltroChange: (key: keyof FiltrosDashboard, value: any) => void;
  onSubsistemaToggle: (checked: boolean | "indeterminate") => void;
  mostrarSubsistemas: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filtros,
  onFiltroChange,
  onSubsistemaToggle,
  mostrarSubsistemas,
}) => {
  const { actividades } = useAppContext();
  const [codigoITRFilter, setCodigoITRFilter] = React.useState("");
  const [modoFiltroAvanzado, setModoFiltroAvanzado] = React.useState(false);

  const sistemasDisponibles = Array.from(
    new Set(actividades.map((act) => act.sistema))
  );

  const subsistemasFiltrados = Array.from(
    new Set(
      actividades
        .filter((act) => !filtros.sistema || act.sistema === filtros.sistema)
        .map((act) => act.subsistema)
    )
  );

  return (
    <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filtros de Sistema</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2">
            <Select
              value={filtros.sistema || "todos"}
              onValueChange={(value) =>
                onFiltroChange(
                  "sistema",
                  value !== "todos" ? value : undefined
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sistemas</SelectItem>
                {sistemasDisponibles.map((sistema) => (
                  <SelectItem key={sistema} value={sistema}>
                    {sistema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-2">
            <Select
              value={filtros.subsistema || "todos"}
              onValueChange={(value) =>
                onFiltroChange(
                  "subsistema",
                  value !== "todos" ? value : undefined
                )
              }
              disabled={!filtros.sistema}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Subsistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los subsistemas</SelectItem>
                {subsistemasFiltrados.map((subsistema) => (
                  <SelectItem key={subsistema} value={subsistema}>
                    {subsistema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Estado ITR</DropdownMenuLabel>
          <div className="p-2">
            <Select
              value={filtros.estadoITRB || "todos"}
              onValueChange={(value: string) =>
                onFiltroChange(
                  "estadoITRB",
                  value !== "todos" ? value : undefined
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="En curso">En curso</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenuSeparator />
          <div className="p-2 flex items-center space-x-2">
            <Checkbox
              id="filter-vencidas"
              checked={!!filtros.tareaVencida}
              onCheckedChange={(checked) =>
                onFiltroChange("tareaVencida", checked)
              }
            />
            <Label htmlFor="filter-vencidas">Mostrar sólo vencidas</Label>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={modoFiltroAvanzado ? "default" : "outline"}
            className={modoFiltroAvanzado ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            <Search className="h-4 w-4 mr-2" />
            Filtro avanzado
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Filtros avanzados</h4>

            <div className="space-y-2">
              <Label htmlFor="codigo-itr">Código ITR</Label>
              <Input
                id="codigo-itr"
                placeholder="Ej: I01A"
                value={codigoITRFilter}
                onChange={(e) => {
                  setCodigoITRFilter(e.target.value);
                  setModoFiltroAvanzado(!!e.target.value);
                  onFiltroChange("busquedaActividad", e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Buscar por código o parte del nombre del ITR
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mostrar-subsistemas"
                checked={mostrarSubsistemas}
                onCheckedChange={onSubsistemaToggle}
              />
              <Label htmlFor="mostrar-subsistemas">Mostrar Subsistemas</Label>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCodigoITRFilter("");
                  setModoFiltroAvanzado(false);
                  onFiltroChange("busquedaActividad", "");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FilterControls;
