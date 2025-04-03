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
  Users,
  SunMoon,
  Download,
  Edit2,
  Trash2,
  Save,
  File,
  Check
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import KPICards from "@/components/KPICards";
import ProyectoSelector from "@/components/ProyectoSelector";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import ActividadesTable from "@/components/ActividadesTable";
import ITRBTable from "@/components/ITRBTable";
import UserManagement from "@/components/UserManagement";
import ReportGenerator from "@/components/ReportGenerator";
import { FiltrosDashboard, ConfiguracionGrafico, Proyecto, Actividad, ITRB, KPIConfig } from "@/types";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import BackupRestore from "@/components/BackupRestore";

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
    updateProyecto,
    deleteProyecto,
    actividades,
    addActividad,
    itrbItems,
    addITRB,
    proyectoActual,
    setProyectoActual,
    kpiConfig,
    updateKPIConfig
  } = useAppContext();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>({
    tamano: "mediano",
    mostrarLeyenda: true
  });
  const [configTab, setConfigTab] = useState("users");

  const [showNewActivityDialog, setShowNewActivityDialog] = useState(false);
  const [showNewITRBDialog, setShowNewITRBDialog] = useState(false);

  const [nuevoProyecto, setNuevoProyecto] = useState<Omit<Proyecto, "id" | "fechaCreacion" | "fechaActualizacion">>({
    titulo: "",
    descripcion: ""
  });
  
  const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null);
  const [showEditProyectoDialog, setShowEditProyectoDialog] = useState(false);

  const [nuevaActividad, setNuevaActividad] = useState<Omit<Actividad, "id">>({
    proyectoId: proyectoActual !== "todos" ? proyectoActual : "",
    nombre: "",
    sistema: "",
    subsistema: "",
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duracion: 7
  });

  const [nuevoITRB, setNuevoITRB] = useState<Omit<ITRB, "id" | "estado">>({
    actividadId: "",
    descripcion: "",
    cantidadTotal: 1,
    cantidadRealizada: 0,
    fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ccc: false,
    observaciones: ""
  });

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
    
    const dialogTrigger = document.querySelector<HTMLButtonElement>('[data-state="open"]');
    if (dialogTrigger) {
      dialogTrigger.click();
    }
  };

  const handleEditarProyecto = (proyecto: Proyecto) => {
    setProyectoEditando({...proyecto});
    setShowEditProyectoDialog(true);
  };

  const handleGuardarProyecto = () => {
    if (proyectoEditando) {
      if (!proyectoEditando.titulo.trim()) {
        toast.error("El título del proyecto es obligatorio");
        return;
      }
      
      const proyectoActualizado: Proyecto = {
        ...proyectoEditando,
        fechaActualizacion: new Date().toISOString()
      };
      
      updateProyecto(proyectoEditando.id, proyectoActualizado);
      setShowEditProyectoDialog(false);
      toast.success("Proyecto actualizado exitosamente", {
        description: "Los cambios se han guardado correctamente."
      });
    }
  };

  const handleEliminarProyecto = (id: string) => {
    deleteProyecto(id);
    
    if (proyectoActual === id) {
      setProyectoActual("todos");
    }
    
    toast.success("Proyecto eliminado exitosamente");
  };

  const handleCrearActividad = () => {
    console.log("Creando actividad:", nuevaActividad);
    
    if (!nuevaActividad.nombre.trim() || !nuevaActividad.sistema.trim() || !nuevaActividad.subsistema.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (!nuevaActividad.proyectoId) {
      toast.error("Debe seleccionar un proyecto");
      return;
    }

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
    setShowNewActivityDialog(false);
  };

  const handleCrearITRB = () => {
    console.log("Creando ITRB:", nuevoITRB);
    
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
    setShowNewITRBDialog(false);
  };

  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaInicio = e.target.value;
    const fechaFin = nuevaActividad.fechaFin;
    
    setNuevaActividad(prev => ({
      ...prev,
      fechaInicio
    }));
    
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

  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaFin = e.target.value;
    const fechaInicio = nuevaActividad.fechaInicio;
    
    setNuevaActividad(prev => ({
      ...prev,
      fechaFin
    }));
    
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

  const handleGenerarPDF = () => {
    const doc = new window.jsPDF();
    const title = proyectoActual !== "todos" 
      ? `Plan de Precomisionado - ${proyectos.find(p => p.id === proyectoActual)?.titulo || 'Todos los proyectos'}`
      : "Plan de Precomisionado - Todos los proyectos";
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    
    const fechaActual = new Date().toLocaleDateString('es-ES');
    doc.text(`Generado por: ${user?.nombre || user?.email}`, 14, 30);
    doc.text(`Fecha: ${fechaActual}`, 14, 36);
    
    doc.setFontSize(14);
    doc.text("Actividades", 14, 50);
    
    const actividadesFiltradas = actividades.filter(actividad => 
      proyectoActual === "todos" || actividad.proyectoId === proyectoActual
    );
    
    if (actividadesFiltradas.length > 0) {
      const actividadesData = actividadesFiltradas.map(act => [
        act.id.substring(0, 8),
        act.nombre,
        act.sistema,
        act.subsistema,
        new Date(act.fechaInicio).toLocaleDateString('es-ES'),
        new Date(act.fechaFin).toLocaleDateString('es-ES'),
        `${act.duracion} días`
      ]);

      (doc as any).autoTable({
        startY: 55,
        head: [['ID', 'Nombre', 'Sistema', 'Subsistema', 'Inicio', 'Fin', 'Duración']],
        body: actividadesData,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99] }
      });
    } else {
      doc.text("No hay actividades para mostrar", 14, 60);
    }
    
    const lastPosition = (doc as any).lastAutoTable?.finalY || 90;
    doc.setFontSize(14);
    doc.text("ITR B", 14, lastPosition + 10);
    
    const itrbFiltrados = itrbItems.filter(itrb => {
      const actividad = actividades.find(act => act.id === itrb.actividadId);
      return !actividad || proyectoActual === "todos" || actividad.proyectoId === proyectoActual;
    });
    
    if (itrbFiltrados.length > 0) {
      const itrbData = itrbFiltrados.map(itrb => {
        const actividad = actividades.find(act => act.id === itrb.actividadId);
        return [
          itrb.id.substring(0, 8),
          itrb.descripcion,
          actividad ? `${actividad.nombre} (${actividad.sistema})` : 'N/A',
          `${itrb.cantidadRealizada}/${itrb.cantidadTotal}`,
          itrb.estado,
          itrb.ccc ? 'Sí' : 'No',
          new Date(itrb.fechaLimite).toLocaleDateString('es-ES')
        ];
      });
      
      (doc as any).autoTable({
        startY: lastPosition + 15,
        head: [['ID', 'Descripción', 'Actividad', 'Progreso', 'Estado', 'CCC', 'Fecha Límite']],
        body: itrbData,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99] }
      });
    } else {
      doc.text("No hay ITR B para mostrar", 14, lastPosition + 15);
    }
    
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Plan de Precomisionado v1.0.0`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save("plan-precomisionado.pdf");
    toast.success("PDF generado exitosamente");
  };

  const handleGenerarExcel = () => {
    toast.info("Funcionalidad de exportación a Excel en desarrollo");
  };
  
  const handleKPIConfigChange = (option: keyof KPIConfig, value: any) => {
    updateKPIConfig({ [option]: value });
    toast.success("Configuración actualizada", {
      description: "La visualización de KPIs ha sido actualizada."
    });
  };

  return (
    <div className={`min-h-screen flex ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <aside className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 h-screen sticky top-0 flex flex-col">
        <div className="p-4 border-b dark:border-slate-700 flex items-center space-x-2">
          <Layers className="h-6 w-6 text-indigo-500" />
          <h1 className="text-xl font-bold text-indigo-500 dark:text-indigo-400">
            Pre-Comisionado
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Button 
            variant={activeTab === "dashboard" ? "default" : "ghost"} 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <Button 
            variant={activeTab === "actividades" ? "default" : "ghost"} 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setActiveTab("actividades")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Actividades
          </Button>
          
          <Button 
            variant={activeTab === "itrb" ? "default" : "ghost"} 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setActiveTab("itrb")}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            ITR B
          </Button>
          
          {isAdmin && (
            <Button 
              variant={activeTab === "proyectos" ? "default" : "ghost"} 
              className="w-full justify-start" 
              size="sm"
              onClick={() => setActiveTab("proyectos")}
            >
              <Layers className="h-4 w-4 mr-2" />
              Proyectos
            </Button>
          )}
          
          {isAdmin && (
            <Button 
              variant={activeTab === "reportes" ? "default" : "ghost"} 
              className="w-full justify-start" 
              size="sm"
              onClick={() => setActiveTab("reportes")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Reportes
            </Button>
          )}
          
          {isAdmin && (
            <Button 
              variant={activeTab === "usuarios" ? "default" : "ghost"} 
              className="w-full justify-start" 
              size="sm"
              onClick={() => setActiveTab("usuarios")}
            >
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </Button>
          )}
          
          {isAdmin && (
            <Button 
              variant={activeTab === "configuracion" ? "default" : "ghost"} 
              className="w-full justify-start" 
              size="sm"
              onClick={() => setActiveTab("configuracion")}
            >
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
            
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("reportes")}>
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
                    <FormSubmitButton type="button" onClick={handleCrearProyecto} onComplete={() => setNuevoProyecto({ titulo: "", descripcion: "" })}>
                      Guardar Proyecto
                    </FormSubmitButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        {activeTab !== "usuarios" && activeTab !== "reportes" && (
          <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />
        )}
        
        {activeTab === "dashboard" && (
          <Card>
            <CardContent className="p-0 h-[600px]">
              <EnhancedGanttChart
                filtros={filtros}
                configuracion={configuracionGrafico}
              />
            </CardContent>
          </Card>
        )}
        
        {activeTab === "actividades" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Actividades</CardTitle>
              {(isAdmin || isTecnico) && (
                <Button onClick={() => setShowNewActivityDialog(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nueva Actividad
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ActividadesTable />
            </CardContent>
          </Card>
        )}
        
        {activeTab === "itrb" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>ITR B</CardTitle>
              {(isAdmin || isTecnico) && (
                <Button onClick={() => setShowNewITRBDialog(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo ITR B
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ITRBTable />
            </CardContent>
          </Card>
        )}
        
        {activeTab === "proyectos" && isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              {proyectos.length > 0 ? (
                <div className="space-y-4">
                  {proyectos.map(proyecto => (
                    <div key={proyecto.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{proyecto.titulo}</h3>
                          <p className="text-sm text-muted-foreground">ID: {proyecto.id}</p>
                          <p className="text-sm mt-2">{proyecto.descripcion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Creado: {new Date(proyecto.fechaCreacion).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditarProyecto(proyecto)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente el proyecto "{proyecto.titulo}"
                                  y todas sus actividades e ITR B asociados. Esta acción no puede deshacerse.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleEliminarProyecto(proyecto.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No hay proyectos creados</p>
                  <Button className="mt-4" onClick={() => document.querySelectorAll('[data-state="closed"]')[0]?.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  }))}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Crear Primer Proyecto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === "reportes" && (
          <Card>
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
              <div className="text-sm text-muted-foreground">
                Genere informes y reportes de su plan de precomisionado
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Exportar datos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seleccione el formato en el que desea exportar los datos
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                  <Button onClick={handleGenerarPDF} className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generar PDF
                  </Button>
                  <Button onClick={handleGenerarExcel} variant="outline" className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generar Excel
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-lg font-medium">Filtrar información</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  El reporte incluirá la información según el proyecto seleccionado actualmente
                </p>
                <ProyectoSelector />
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === "usuarios" && isAdmin && (
          <UserManagement />
        )}
        
        {activeTab === "configuracion" && isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={configTab} onValueChange={setConfigTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="users">Usuarios</TabsTrigger>
                  <TabsTrigger value="projects">Proyectos</TabsTrigger>
                  <TabsTrigger value="reports">Reportes</TabsTrigger>
                  <TabsTrigger value="backup">Backup y Restauración</TabsTrigger>
                </TabsList>
                
                <TabsContent value="users" className="space-y-4">
                  <UserManagement />
                </TabsContent>
                
                <TabsContent value="projects" className="space-y-4">
                  <ProyectoSelector />
                </TabsContent>
                
                <TabsContent value="reports" className="space-y-4">
                  <ReportGenerator />
                </TabsContent>
                
                <TabsContent value="backup" className="space-y-4">
                  <BackupRestore />
                </TabsContent>
              </Tabs>
            
              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Exportar datos</h3>
                  <div className="flex space-x-2">
                    <Button onClick={() => setActiveTab("reportes")}>
                      <Download className="h-4 w-4 mr-2" />
                      Ir a Reportes
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Configuración de KPIs</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="itrVencidosMostrar">
                        ITR B Vencidos - Datos a mostrar
                      </Label>
                      <Select 
                        value={kpiConfig.itrVencidosMostrar}
                        onValueChange={(value) => handleKPIConfigChange("itrVencidosMostrar", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar visualización" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Total de vencidos</SelectItem>
                          <SelectItem value="diferencia">Diferencia (completados - pendientes)</SelectItem>
                          <SelectItem value="pendientes">Pendientes vencidos</SelectItem>
                          <SelectItem value="completados">Completados fuera de fecha</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seleccione qué dato desea ver destacado en el KPI de ITR B Vencidos
                      </p>
                    </div>
                    
                    {/* Aquí se pueden agregar más opciones de configuración para otros KPIs */}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Apariencia</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={toggleTheme}>
                      <SunMoon className="h-4 w-4 mr-2" />
                      Cambiar a modo {theme.mode === "dark" ? "claro" : "oscuro"}
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Acerca de</h3>
                  <p className="text-sm text-muted-foreground">
                    Plan de Precomisionado v1.0.0<br />
                    © {new Date().getFullYear()} Fossil Energy
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Dialog open={showEditProyectoDialog} onOpenChange={setShowEditProyectoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Proyecto</DialogTitle>
              <DialogDescription>
                Modifique los datos del proyecto
              </DialogDescription>
            </DialogHeader>
            
            {proyectoEditando && (
              <div className="space-y-4 py-3">
                <div className="space-y-2">
                  <Label htmlFor="tituloEdit">Título del Proyecto *</Label>
                  <Input 
                    id="tituloEdit" 
                    value={proyectoEditando.titulo}
                    onChange={(e) => setProyectoEditando({...proyectoEditando, titulo: e.target.value})}
                    placeholder="Título del proyecto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcionEdit">Descripción</Label>
                  <Textarea 
                    id="descripcionEdit"
                    value={proyectoEditando.descripcion}
                    onChange={(e) => setProyectoEditando({...proyectoEditando, descripcion: e.target.value})}
                    placeholder="Descripción del proyecto..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditProyectoDialog(false)}>
                Cancelar
              </Button>
              <FormSubmitButton onClick={handleGuardarProyecto} onComplete={() => setShowEditProyectoDialog(false)}>
                Guardar Cambios
              </FormSubmitButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showNewActivityDialog} onOpenChange={setShowNewActivityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Actividad</DialogTitle>
              <DialogDescription>
                Complete la información de la nueva actividad
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="proyectoId">Proyecto *</Label>
                <Select 
                  value={nuevaActividad.proyectoId}
                  onValueChange={(value) => setNuevaActividad({...nuevaActividad, proyectoId: value})}
                >
                  <SelectTrigger className="w-full">
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
              
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Actividad *</Label>
                <Input 
                  id="nombre" 
                  value={nuevaActividad.nombre}
                  onChange={(e) => setNuevaActividad({...nuevaActividad, nombre: e.target.value})}
                  placeholder="Ej: Verificación de Presión"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sistema">Sistema *</Label>
                <Input 
                  id="sistema" 
                  value={nuevaActividad.sistema}
                  onChange={(e) => setNuevaActividad({...nuevaActividad, sistema: e.target.value})}
                  placeholder="Ej: Sistema de Refrigeración"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subsistema">Subsistema *</Label>
                <Input 
                  id="subsistema" 
                  value={nuevaActividad.subsistema}
                  onChange={(e) => setNuevaActividad({...nuevaActividad, subsistema: e.target.value})}
                  placeholder="Ej: Torres de Enfriamiento"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                  <Input 
                    id="fechaInicio" 
                    type="date"
                    value={nuevaActividad.fechaInicio}
                    onChange={handleFechaInicioChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha Fin *</Label>
                  <Input 
                    id="fechaFin" 
                    type="date"
                    value={nuevaActividad.fechaFin}
                    onChange={handleFechaFinChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (días)</Label>
                <Input 
                  id="duracion" 
                  type="number"
                  value={nuevaActividad.duracion}
                  readOnly
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La duración se calcula automáticamente a partir de las fechas
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewActivityDialog(false)}>
                Cancelar
              </Button>
              <FormSubmitButton onClick={handleCrearActividad} onComplete={() => setShowNewActivityDialog(false)}>
                Guardar Actividad
              </FormSubmitButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showNewITRBDialog} onOpenChange={setShowNewITRBDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo ITR B</DialogTitle>
              <DialogDescription>
                Complete la información del nuevo ITR B
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="actividadId">Actividad *</Label>
                <Select 
                  value={nuevoITRB.actividadId}
                  onValueChange={(value) => setNuevoITRB({...nuevoITRB, actividadId: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    {actividades
                      .filter(a => proyectoActual === "todos" || a.proyectoId === proyectoActual)
                      .map(actividad => (
                        <SelectItem key={actividad.id} value={actividad.id}>
                          {actividad.nombre} ({actividad.sistema})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea 
                  id="descripcion"
                  value={nuevoITRB.descripcion}
                  onChange={(e) => setNuevoITRB({...nuevoITRB, descripcion: e.target.value})}
                  placeholder="Descripción del ITR B..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidadTotal">Cantidad Total *</Label>
                  <Input 
                    id="cantidadTotal" 
                    type="number"
                    min={1}
                    value={nuevoITRB.cantidadTotal}
                    onChange={(e) => setNuevoITRB({...nuevoITRB, cantidadTotal: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cantidadRealizada">Cantidad Realizada</Label>
                  <Input 
                    id="cantidadRealizada" 
                    type="number"
                    min={0}
                    value={nuevoITRB.cantidadRealizada}
                    onChange={(e) => setNuevoITRB({...nuevoITRB, cantidadRealizada: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fechaLimite">Fecha Límite *</Label>
                <Input 
                  id="fechaLimite" 
                  type="date"
                  value={nuevoITRB.fechaLimite}
                  onChange={(e) => setNuevoITRB({...nuevoITRB, fechaLimite: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mcc"
                  checked={nuevoITRB.mcc}
                  onCheckedChange={(checked) => 
                    setNuevoITRB({...nuevoITRB, mcc: checked === true})
                  }
                />
                <Label htmlFor="mcc" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Control de Calidad Completado (MCC)
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea 
                  id="observaciones"
                  value={nuevoITRB.observaciones}
                  onChange={(e) => setNuevoITRB({...nuevoITRB, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewITRBDialog(false)}>
                Cancelar
              </Button>
              <FormSubmitButton onClick={handleCrearITRB} onComplete={() => setShowNewITRBDialog(false)}>
                Guardar ITR B
              </FormSubmitButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPanel;
