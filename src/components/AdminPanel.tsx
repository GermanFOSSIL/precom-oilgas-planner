
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Layers,
  FileText,
  Settings,
  Bell,
  SunMoon,
  Download,
  CalendarIcon,
  CheckCircle,
  Save
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import KPICards from "@/components/KPICards";
import ProyectoSelector from "@/components/ProyectoSelector";
import GanttChart from "@/components/GanttChart";
import ActividadesTable from "@/components/ActividadesTable";
import ITRBTable from "@/components/ITRBTable";
import { FiltrosDashboard, ConfiguracionGrafico, Proyecto, Actividad, ITRB } from "@/types";

const AdminPanel: React.FC = () => {
  const { 
    user, 
    logout, 
    isAdmin, 
    isTecnico, 
    theme, 
    toggleTheme, 
    filtros,
    proyectos,
    addProyecto,
    actividades,
    addActividad,
    itrbItems,
    addITRB,
    proyectoActual,
    setProyectoActual
  } = useAppContext();
  
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });

  // Estados para el nuevo proyecto
  const [nuevoProyecto, setNuevoProyecto] = useState<Omit<Proyecto, "id" | "fechaCreacion" | "fechaActualizacion">>({
    titulo: "",
    descripcion: ""
  });

  // Estados para la nueva actividad
  const [nuevaActividad, setNuevaActividad] = useState<Omit<Actividad, "id">>({
    proyectoId: proyectoActual !== "todos" ? proyectoActual : "",
    nombre: "",
    sistema: "",
    subsistema: "",
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duracion: 7
  });

  // Estados para el nuevo ITR B
  const [nuevoITRB, setNuevoITRB] = useState<Omit<ITRB, "id" | "estado">>({
    actividadId: "",
    descripcion: "",
    cantidadTotal: 1,
    cantidadRealizada: 0,
    fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ccc: false,
    observaciones: ""
  });

  // Handler para crear un nuevo proyecto
  const handleCrearProyecto = () => {
    if (!nuevoProyecto.titulo.trim()) {
      toast.error("El título del proyecto es obligatorio");
      return;
    }

    const now = new Date().toISOString();
    const proyecto: Proyecto = {
      id: `proyecto-${Date.now()}`,
      titulo: nuevoProyecto.titulo,
      descripcion: nuevoProyecto.descripcion,
      fechaCreacion: now,
      fechaActualizacion: now
    };

    addProyecto(proyecto);
    setNuevoProyecto({ titulo: "", descripcion: "" });
    toast.success("Proyecto creado exitosamente");
  };

  // Handler para crear una nueva actividad
  const handleCrearActividad = () => {
    if (!nuevaActividad.nombre.trim() || !nuevaActividad.sistema.trim() || !nuevaActividad.subsistema.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (!nuevaActividad.proyectoId) {
      toast.error("Debe seleccionar un proyecto");
      return;
    }

    // Calcular la duración en días
    const inicio = new Date(nuevaActividad.fechaInicio);
    const fin = new Date(nuevaActividad.fechaFin);
    const duracionDias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));

    const actividad: Actividad = {
      id: `actividad-${Date.now()}`,
      ...nuevaActividad,
      duracion: duracionDias > 0 ? duracionDias : 1
    };

    addActividad(actividad);
    setNuevaActividad({
      proyectoId: proyectoActual !== "todos" ? proyectoActual : "",
      nombre: "",
      sistema: "",
      subsistema: "",
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duracion: 7
    });
    toast.success("Actividad creada exitosamente");
  };

  // Handler para crear un nuevo ITR B
  const handleCrearITRB = () => {
    if (!nuevoITRB.actividadId || !nuevoITRB.descripcion.trim()) {
      toast.error("La actividad y descripción son obligatorias");
      return;
    }

    const itrb: ITRB = {
      id: `itrb-${Date.now()}`,
      ...nuevoITRB,
      estado: "En curso"
    };

    addITRB(itrb);
    setNuevoITRB({
      actividadId: "",
      descripcion: "",
      cantidadTotal: 1,
      cantidadRealizada: 0,
      fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ccc: false,
      observaciones: ""
    });
    toast.success("ITR B creado exitosamente");
  };

  // Handler para cambiar la fecha de inicio y actualizar la duración
  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaInicio = e.target.value;
    const fechaFin = nuevaActividad.fechaFin;
    
    setNuevaActividad(prev => ({
      ...prev,
      fechaInicio
    }));
    
    // Actualizar duración si ambas fechas son válidas
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const duracionDias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      if (duracionDias >= 0) {
        setNuevaActividad(prev => ({
          ...prev,
          duracion: duracionDias
        }));
      }
    }
  };

  // Handler para cambiar la fecha de fin y actualizar la duración
  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaFin = e.target.value;
    const fechaInicio = nuevaActividad.fechaInicio;
    
    setNuevaActividad(prev => ({
      ...prev,
      fechaFin
    }));
    
    // Actualizar duración si ambas fechas son válidas
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const duracionDias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      if (duracionDias >= 0) {
        setNuevaActividad(prev => ({
          ...prev,
          duracion: duracionDias
        }));
      }
    }
  };

  return (
    <div className={`min-h-screen flex ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 h-screen sticky top-0 flex flex-col">
        <div className="p-4 border-b dark:border-slate-700 flex items-center space-x-2">
          <Layers className="h-6 w-6 text-indigo-500" />
          <h1 className="text-xl font-bold text-indigo-500 dark:text-indigo-400">
            Pre-Comisionado
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Actividades
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            ITR B
          </Button>
          
          {isAdmin && (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Layers className="h-4 w-4 mr-2" />
              Proyectos
            </Button>
          )}
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </Button>
          
          {isAdmin && (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          )}
        </nav>
        
        <div className="p-4 border-t dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              <SunMoon className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">{user?.nombre || user?.email.split('@')[0]}</div>
            <div>{user?.email}</div>
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {isAdmin ? "Administrador" : isTecnico ? "Técnico" : "Visualizador"}
            </div>
          </div>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isAdmin ? "Panel de Administración" : "Panel de Técnico"}
          </h1>
          <div className="flex gap-2">
            <ProyectoSelector />
            
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                    <DialogDescription>
                      Complete la información del nuevo proyecto
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-3">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título del Proyecto *</Label>
                      <Input 
                        id="titulo" 
                        value={nuevoProyecto.titulo}
                        onChange={(e) => setNuevoProyecto({...nuevoProyecto, titulo: e.target.value})}
                        placeholder="Ej: Planta de Procesamiento Vaca Muerta"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea 
                        id="descripcion"
                        value={nuevoProyecto.descripcion}
                        onChange={(e) => setNuevoProyecto({...nuevoProyecto, descripcion: e.target.value})}
                        placeholder="Descripción del proyecto..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setNuevoProyecto({ titulo: "", descripcion: "" })}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleCrearProyecto}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Proyecto
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />
        
        <Tabs defaultValue="gantt" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="gantt">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Diagrama Gantt
            </TabsTrigger>
            <TabsTrigger value="actividades">
              <FileText className="h-4 w-4 mr-2" />
              Actividades
            </TabsTrigger>
            <TabsTrigger value="itrb">
              <CheckCircle className="h-4 w-4 mr-2" />
              ITR B
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <Bell className="h-4 w-4 mr-2" />
              Alertas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gantt">
            <Card>
              <CardContent className="p-0 h-[600px]">
                <GanttChart
                  filtros={filtros}
                  configuracion={configuracionGrafico}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="actividades">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Actividades</CardTitle>
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Nueva Actividad
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Actividad</DialogTitle>
                        <DialogDescription>
                          Complete los datos para la nueva actividad
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-3">
                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="proyectoActividad">Proyecto *</Label>
                          <Select 
                            value={nuevaActividad.proyectoId}
                            onValueChange={(value) => setNuevaActividad({...nuevaActividad, proyectoId: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                            <SelectContent>
                              {proyectos.map(proyecto => (
                                <SelectItem key={proyecto.id} value={proyecto.id}>
                                  {proyecto.titulo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="nombreActividad">Nombre de Actividad *</Label>
                          <Input 
                            id="nombreActividad"
                            value={nuevaActividad.nombre}
                            onChange={(e) => setNuevaActividad({...nuevaActividad, nombre: e.target.value})}
                            placeholder="Ej: Montaje de equipos"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sistema">Sistema *</Label>
                            <Input 
                              id="sistema"
                              value={nuevaActividad.sistema}
                              onChange={(e) => setNuevaActividad({...nuevaActividad, sistema: e.target.value})}
                              placeholder="Ej: Sistema Eléctrico"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subsistema">Subsistema *</Label>
                            <Input 
                              id="subsistema"
                              value={nuevaActividad.subsistema}
                              onChange={(e) => setNuevaActividad({...nuevaActividad, subsistema: e.target.value})}
                              placeholder="Ej: Iluminación"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                            <Input 
                              id="fechaInicio"
                              type="date"
                              value={nuevaActividad.fechaInicio}
                              onChange={handleFechaInicioChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fechaFin">Fecha Fin</Label>
                            <Input 
                              id="fechaFin"
                              type="date"
                              value={nuevaActividad.fechaFin}
                              onChange={handleFechaFinChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="duracion">Duración (días)</Label>
                            <Input 
                              id="duracion"
                              type="number"
                              value={nuevaActividad.duracion}
                              onChange={(e) => setNuevaActividad({...nuevaActividad, duracion: parseInt(e.target.value)})}
                              min={1}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNuevaActividad({
                          proyectoId: proyectoActual !== "todos" ? proyectoActual : "",
                          nombre: "",
                          sistema: "",
                          subsistema: "",
                          fechaInicio: new Date().toISOString().split('T')[0],
                          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          duracion: 7
                        })}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCrearActividad}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Actividad
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <ActividadesTable />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="itrb">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>ITR B</CardTitle>
                {(isAdmin || isTecnico) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Nuevo ITR B
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo ITR B</DialogTitle>
                        <DialogDescription>
                          Asocie el ITR B a una actividad existente
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-3">
                        <div className="space-y-2">
                          <Label htmlFor="actividadId">Actividad Asociada *</Label>
                          <Select 
                            value={nuevoITRB.actividadId}
                            onValueChange={(value) => setNuevoITRB({...nuevoITRB, actividadId: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar actividad" />
                            </SelectTrigger>
                            <SelectContent>
                              {actividades
                                .filter(act => proyectoActual === "todos" || act.proyectoId === proyectoActual)
                                .map(actividad => (
                                  <SelectItem key={actividad.id} value={actividad.id}>
                                    {actividad.nombre} ({actividad.sistema} - {actividad.subsistema})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="descripcionITRB">Descripción *</Label>
                          <Input 
                            id="descripcionITRB"
                            value={nuevoITRB.descripcion}
                            onChange={(e) => setNuevoITRB({...nuevoITRB, descripcion: e.target.value})}
                            placeholder="Ej: Revisión de montaje de luminarias"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cantidadTotal">Cantidad Total</Label>
                            <Input 
                              id="cantidadTotal"
                              type="number"
                              value={nuevoITRB.cantidadTotal}
                              onChange={(e) => setNuevoITRB({...nuevoITRB, cantidadTotal: parseInt(e.target.value)})}
                              min={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cantidadRealizada">Cantidad Realizada</Label>
                            <Input 
                              id="cantidadRealizada"
                              type="number"
                              value={nuevoITRB.cantidadRealizada}
                              onChange={(e) => setNuevoITRB({...nuevoITRB, cantidadRealizada: parseInt(e.target.value)})}
                              min={0}
                              max={nuevoITRB.cantidadTotal}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fechaLimite">Fecha Límite</Label>
                            <Input 
                              id="fechaLimite"
                              type="date"
                              value={nuevoITRB.fechaLimite}
                              onChange={(e) => setNuevoITRB({...nuevoITRB, fechaLimite: e.target.value})}
                            />
                          </div>
                          <div className="flex items-center space-x-2 pt-8">
                            <input
                              type="checkbox"
                              id="ccc"
                              checked={nuevoITRB.ccc}
                              onChange={(e) => setNuevoITRB({...nuevoITRB, ccc: e.target.checked})}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="ccc">Marcar como CCC</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="observaciones">Observaciones</Label>
                          <Textarea 
                            id="observaciones"
                            value={nuevoITRB.observaciones || ""}
                            onChange={(e) => setNuevoITRB({...nuevoITRB, observaciones: e.target.value})}
                            placeholder="Observaciones adicionales..."
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNuevoITRB({
                          actividadId: "",
                          descripcion: "",
                          cantidadTotal: 1,
                          cantidadRealizada: 0,
                          fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          ccc: false,
                          observaciones: ""
                        })}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCrearITRB}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar ITR B
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <ITRBTable />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alertas">
            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground py-10">
                  Sistema de alertas (en desarrollo)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="py-6 border-t mt-6 text-center text-xs text-muted-foreground">
          Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
