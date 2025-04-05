
import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { ITRB, Actividad } from "@/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight,
  ChevronDown,
  Search,
  Link2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Filter,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ITRBRelationshipView: React.FC = () => {
  const { actividades, itrbItems, proyectos, filtros } = useAppContext();
  const [expandedActividades, setExpandedActividades] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("sistema");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Checkbox filter states
  const [selectedSistemas, setSelectedSistemas] = useState<string[]>([]);
  const [selectedSubsistemas, setSelectedSubsistemas] = useState<string[]>([]);
  const [showSistemasFilter, setShowSistemasFilter] = useState(false);
  const [showSubsistemasFilter, setShowSubsistemasFilter] = useState(false);

  const toggleActividad = (actividadId: string) => {
    setExpandedActividades(prev => ({
      ...prev,
      [actividadId]: !prev[actividadId]
    }));
  };

  // Get all available systems and subsystems for filtering
  const allSistemas = useMemo(() => 
    Array.from(new Set(actividades.map(act => act.sistema))).sort(),
    [actividades]
  );
  
  const allSubsistemas = useMemo(() => 
    Array.from(new Set(actividades.map(act => act.subsistema))).sort(),
    [actividades]
  );

  // Toggle sistema selection
  const toggleSistema = (sistema: string) => {
    setSelectedSistemas(prev => 
      prev.includes(sistema) 
        ? prev.filter(s => s !== sistema) 
        : [...prev, sistema]
    );
  };

  // Toggle subsistema selection
  const toggleSubsistema = (subsistema: string) => {
    setSelectedSubsistemas(prev => 
      prev.includes(subsistema) 
        ? prev.filter(s => s !== subsistema) 
        : [...prev, subsistema]
    );
  };

  // Clear all sistema filters
  const clearSistemaFilters = () => {
    setSelectedSistemas([]);
  };

  // Clear all subsistema filters
  const clearSubsistemaFilters = () => {
    setSelectedSubsistemas([]);
  };
  
  const actividadesConITRB = useMemo(() => {
    let actividadesFiltradas = actividades;

    if (filtros.proyecto !== "todos") {
      actividadesFiltradas = actividadesFiltradas.filter(
        act => act.proyectoId === filtros.proyecto
      );
    }

    // Apply sistema checkbox filters
    if (selectedSistemas.length > 0) {
      actividadesFiltradas = actividadesFiltradas.filter(
        act => selectedSistemas.includes(act.sistema)
      );
    } else if (filtros.sistema) {
      actividadesFiltradas = actividadesFiltradas.filter(
        act => act.sistema === filtros.sistema
      );
    }
    
    // Apply subsistema checkbox filters
    if (selectedSubsistemas.length > 0) {
      actividadesFiltradas = actividadesFiltradas.filter(
        act => selectedSubsistemas.includes(act.subsistema)
      );
    } else if (filtros.subsistema) {
      actividadesFiltradas = actividadesFiltradas.filter(
        act => act.subsistema === filtros.subsistema
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      actividadesFiltradas = actividadesFiltradas.filter(
        act => act.nombre.toLowerCase().includes(query) || 
              act.sistema.toLowerCase().includes(query) || 
              act.subsistema.toLowerCase().includes(query)
      );
    }

    return actividadesFiltradas.map(actividad => {
      const itrbsAsociados = itrbItems.filter(
        itrb => itrb.actividadId === actividad.id
      );

      const totalITRBs = itrbsAsociados.length;
      const completados = itrbsAsociados.filter(itrb => itrb.estado === "Completado").length;
      const enCurso = itrbsAsociados.filter(itrb => itrb.estado === "En curso").length;
      const vencidos = itrbsAsociados.filter(itrb => itrb.estado === "Vencido").length;
      const progreso = totalITRBs > 0 ? (completados / totalITRBs) * 100 : 0;

      const proyecto = proyectos.find(p => p.id === actividad.proyectoId);

      return {
        actividad,
        itrbs: itrbsAsociados,
        totalITRBs,
        completados,
        enCurso,
        vencidos,
        progreso,
        proyecto: proyecto?.titulo || "Sin proyecto"
      };
    });
  }, [actividades, itrbItems, proyectos, filtros, searchQuery, selectedSistemas, selectedSubsistemas]);

  const actividadesOrdenadas = useMemo(() => {
    return [...actividadesConITRB].sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case "nombre":
          valueA = a.actividad.nombre;
          valueB = b.actividad.nombre;
          break;
        case "proyecto":
          valueA = a.proyecto;
          valueB = b.proyecto;
          break;
        case "sistema":
          valueA = a.actividad.sistema;
          valueB = b.actividad.sistema;
          break;
        case "subsistema":
          valueA = a.actividad.subsistema;
          valueB = b.actividad.subsistema;
          break;
        case "itrbs":
          valueA = a.totalITRBs;
          valueB = b.totalITRBs;
          break;
        case "progreso":
          valueA = a.progreso;
          valueB = b.progreso;
          break;
        case "vencidos":
          valueA = a.vencidos;
          valueB = b.vencidos;
          break;
        default:
          valueA = a.actividad.sistema;
          valueB = b.actividad.sistema;
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      
      if (sortDirection === "asc") {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
  }, [actividadesConITRB, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getColorByEstado = (estado: string): string => {
    switch (estado) {
      case "Completado": return "bg-green-500 hover:bg-green-600";
      case "En curso": return "bg-amber-500 hover:bg-amber-600";
      case "Vencido": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getIconByEstado = (estado: string) => {
    switch (estado) {
      case "Completado": return <CheckCircle className="h-4 w-4" />;
      case "En curso": return <Clock className="h-4 w-4" />;
      case "Vencido": return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Link2 className="mr-2 h-5 w-5" />
              Relación Actividades - ITR B
            </CardTitle>
            <CardDescription>
              Vista de relaciones entre actividades e ITR B
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar actividad..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Popover open={showSistemasFilter} onOpenChange={setShowSistemasFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Sistemas
                  {selectedSistemas.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedSistemas.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Filtrar por sistemas</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={clearSistemaFilters}
                      disabled={selectedSistemas.length === 0}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                  <ScrollArea className="h-72">
                    <div className="space-y-1">
                      {allSistemas.map(sistema => (
                        <div key={sistema} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`filter-sistema-${sistema}`} 
                            checked={selectedSistemas.includes(sistema)}
                            onCheckedChange={() => toggleSistema(sistema)}
                          />
                          <Label htmlFor={`filter-sistema-${sistema}`} className="text-sm">
                            {sistema}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover open={showSubsistemasFilter} onOpenChange={setShowSubsistemasFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Subsistemas
                  {selectedSubsistemas.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedSubsistemas.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Filtrar por subsistemas</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={clearSubsistemaFilters}
                      disabled={selectedSubsistemas.length === 0}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                  <ScrollArea className="h-72">
                    <div className="space-y-1">
                      {allSubsistemas.map(subsistema => (
                        <div key={subsistema} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`filter-subsistema-${subsistema}`} 
                            checked={selectedSubsistemas.includes(subsistema)}
                            onCheckedChange={() => toggleSubsistema(subsistema)}
                          />
                          <Label htmlFor={`filter-subsistema-${subsistema}`} className="text-sm">
                            {subsistema}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("nombre")}>
                  <div className="flex items-center">
                    Actividad
                    {sortField === "nombre" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("proyecto")}>
                  <div className="flex items-center">
                    Proyecto
                    {sortField === "proyecto" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("sistema")}>
                  <div className="flex items-center">
                    Sistema
                    {sortField === "sistema" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("subsistema")}>
                  <div className="flex items-center">
                    Subsistema
                    {sortField === "subsistema" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => handleSort("itrbs")}>
                  <div className="flex items-center justify-center">
                    ITR B
                    {sortField === "itrbs" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("progreso")}>
                  <div className="flex items-center">
                    Progreso
                    {sortField === "progreso" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => handleSort("vencidos")}>
                  <div className="flex items-center justify-center">
                    Vencidos
                    {sortField === "vencidos" && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actividadesOrdenadas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No se encontraron actividades que coincidan con los filtros</p>
                  </TableCell>
                </TableRow>
              ) : (
                actividadesOrdenadas.map(({ actividad, itrbs, totalITRBs, completados, enCurso, vencidos, progreso, proyecto }) => (
                  <React.Fragment key={actividad.id}>
                    <TableRow 
                      className={`hover:bg-slate-100 dark:hover:bg-slate-700 ${expandedActividades[actividad.id] ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                      onClick={() => toggleActividad(actividad.id)}
                    >
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {expandedActividades[actividad.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{actividad.nombre}</TableCell>
                      <TableCell>{proyecto}</TableCell>
                      <TableCell>{actividad.sistema}</TableCell>
                      <TableCell>{actividad.subsistema}</TableCell>
                      <TableCell className="text-center">
                        <Badge>{totalITRBs}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <Progress value={progreso} className="h-2" />
                          <div className="flex justify-between mt-1 text-xs">
                            <span>{completados}/{totalITRBs}</span>
                            <span>{Math.round(progreso)}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {vencidos > 0 ? (
                          <Badge variant="destructive">{vencidos}</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">0</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {expandedActividades[actividad.id] && (
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-4">
                            <h4 className="text-sm font-medium mb-2">ITR B Asociados</h4>
                            {itrbs.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">No hay ITR B asociados a esta actividad</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {itrbs.map(itrb => (
                                  <Card key={itrb.id} className="overflow-hidden border dark:border-slate-700">
                                    <div className={`h-1.5 w-full ${getColorByEstado(itrb.estado)}`}></div>
                                    <CardContent className="p-3">
                                      <div className="flex justify-between items-start">
                                        <h5 className="text-sm font-medium line-clamp-2 flex-1">{itrb.descripcion}</h5>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Badge className={getColorByEstado(itrb.estado)}>
                                                <span className="flex items-center gap-1">
                                                  {getIconByEstado(itrb.estado)}
                                                  {itrb.estado}
                                                </span>
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Estado: {itrb.estado}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                      
                                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                        <div>
                                          <span className="text-muted-foreground">Progreso:</span>{" "}
                                          <span className="font-medium">{itrb.cantidadRealizada}/{itrb.cantidadTotal}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">MCC:</span>{" "}
                                          <span className="font-medium">{itrb.mcc ? "Sí" : "No"}</span>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground">Fecha límite:</span>{" "}
                                          <span className="font-medium">
                                            {new Date(itrb.fechaLimite).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ITRBRelationshipView;
