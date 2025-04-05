import React, { useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { FiltrosDashboard } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, ChevronDown, Search, X, ClipboardList } from "lucide-react";
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
import { toast } from "sonner";
import { debounce } from "lodash";
import TechnicianActions from "./TechnicianActions";

interface FilterControlsProps {
  filtros: FiltrosDashboard;
  onFiltroChange: (key: keyof FiltrosDashboard, value: any) => void;
  onSubsistemaToggle: (checked: boolean | "indeterminate") => void;
  mostrarSubsistemas: boolean;
  onClearAllFilters: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filtros,
  onFiltroChange,
  onSubsistemaToggle,
  mostrarSubsistemas,
  onClearAllFilters
}) => {
  const { actividades } = useAppContext();
  const [codigoITRFilter, setCodigoITRFilter] = React.useState("");
  const [modoFiltroAvanzado, setModoFiltroAvanzado] = React.useState(false);

  const sistemasDisponibles = React.useMemo(() => Array.from(
    new Set(actividades.map((act) => act.sistema))
  ), [actividades]);

  const subsistemasFiltrados = React.useMemo(() => Array.from(
    new Set(
      actividades
        .filter((act) => !filtros.sistema || act.sistema === filtros.sistema)
        .map((act) => act.subsistema)
    )
  ), [actividades, filtros.sistema]);

  // Verificar si hay filtros activos
  const hayFiltrosActivos = React.useMemo(() => !!(
    filtros.sistema ||
    filtros.subsistema ||
    filtros.estadoITRB ||
    filtros.tareaVencida ||
    filtros.busquedaActividad ||
    filtros.itrFilter
  ), [filtros]);
  
  // Utilizar debounce para mejorar rendimiento en los cambios de filtro de texto
  const debouncedFilterChange = useCallback(
    debounce((key: keyof FiltrosDashboard, value: any) => {
      // Siempre convertir a minúsculas para búsquedas insensibles a mayúsculas/minúsculas
      if (typeof value === 'string' && key === 'busquedaActividad') {
        value = value.toLowerCase();
      }
      onFiltroChange(key, value);
    }, 300),
    [onFiltroChange]
  );
  
  // Manejar cambio en búsqueda de código ITR con debounce
  const handleITRCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodigoITRFilter(value);
    setModoFiltroAvanzado(!!value);
    debouncedFilterChange("busquedaActividad", value);
  };
  
  // Limpiar todos los filtros
  const handleClearAllFilters = () => {
    setCodigoITRFilter("");
    setModoFiltroAvanzado(false);
    onClearAllFilters();
    toast.success("Todos los filtros han sido restablecidos");
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
      {/* ITR Management Button - Added here for easy access */}
      <TechnicianActions size="sm" />
      
      {/* Botón para limpiar todos los filtros */}
      {hayFiltrosActivos && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAllFilters}
          className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        >
          <X className="h-4 w-4 mr-1" /> Limpiar filtros
        </Button>
      )}
    
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
                  <SelectItem key={sistema} value={sistema || "sin-sistema"}>
                    {sistema || "Sin sistema"}
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
                  <SelectItem key={subsistema} value={subsistema || "sin-subsistema"}>
                    {subsistema || "Sin subsistema"}
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
          
          <DropdownMenuSeparator />
          <div className="p-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleClearAllFilters}
            >
              <X className="h-4 w-4 mr-1" /> Limpiar todos los filtros
            </Button>
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
                onChange={handleITRCodeChange}
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

            <div className="flex justify-between">
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
              
              <Button 
                size="sm"
                onClick={() => toast.success("Filtros aplicados")}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FilterControls;
