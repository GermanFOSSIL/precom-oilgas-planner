import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { 
  User, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Lock, 
  UserCog,
  KeyRound
} from "lucide-react";
import { PersistentStorage } from "@/services/PersistentStorage";

// Structure for permissions
interface UserPermission {
  dashboard: boolean;
  actividades: boolean;
  itrb: boolean;
  proyectos: boolean;
  reportes: boolean;
  configuracion: boolean;
}

// Structure for User
interface AppUser {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: "admin" | "tecnico" | "viewer";
  permisos: UserPermission;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

const UserManagement: React.FC = () => {
  const { user, isAdmin, changePassword } = useAppContext();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  
  // Nuevo usuario
  const [newUser, setNewUser] = useState<Omit<AppUser, "id" | "fechaCreacion" | "activo">>({
    nombre: "",
    email: "",
    password: "",
    rol: "viewer",
    permisos: {
      dashboard: true,
      actividades: false,
      itrb: false,
      proyectos: false,
      reportes: false,
      configuracion: false
    }
  });
  
  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Load users from persistent storage
  useEffect(() => {
    async function loadUsers() {
      try {
        const loadedUsers = await PersistentStorage.getUsers();
        if (loadedUsers && loadedUsers.length > 0) {
          setUsers(loadedUsers);
        } else {
          // If no users in storage, use example users
          const mockUsers: AppUser[] = [
            {
              id: "user-1",
              nombre: "Admin Principal",
              email: "admin@fossil.com",
              password: "********",
              rol: "admin",
              permisos: {
                dashboard: true,
                actividades: true,
                itrb: true,
                proyectos: true,
                reportes: true,
                configuracion: true
              },
              activo: true,
              fechaCreacion: "2023-01-15T10:30:00Z",
              ultimoAcceso: new Date().toISOString()
            },
            {
              id: "user-2",
              nombre: "Técnico Test",
              email: "tecnico@ejemplo.com",
              password: "********",
              rol: "tecnico",
              permisos: {
                dashboard: true,
                actividades: true,
                itrb: true,
                proyectos: false,
                reportes: true,
                configuracion: false
              },
              activo: true,
              fechaCreacion: "2023-02-20T14:15:00Z",
              ultimoAcceso: "2023-05-10T09:45:00Z"
            },
            {
              id: "user-3",
              nombre: "Visualizador",
              email: "viewer@ejemplo.com",
              password: "********",
              rol: "viewer",
              permisos: {
                dashboard: true,
                actividades: true,
                itrb: false,
                proyectos: false,
                reportes: false,
                configuracion: false
              },
              activo: true,
              fechaCreacion: "2023-03-05T11:20:00Z",
              ultimoAcceso: "2023-05-09T16:30:00Z"
            }
          ];
          setUsers(mockUsers);
        }
      } catch (error) {
        console.error("Error loading users:", error);
        // Fallback to mock users
        const mockUsers: AppUser[] = [
          {
            id: "user-1",
            nombre: "Admin Principal",
            email: "admin@fossil.com",
            password: "********",
            rol: "admin",
            permisos: {
              dashboard: true,
              actividades: true,
              itrb: true,
              proyectos: true,
              reportes: true,
              configuracion: true
            },
            activo: true,
            fechaCreacion: "2023-01-15T10:30:00Z",
            ultimoAcceso: new Date().toISOString()
          },
          {
            id: "user-2",
            nombre: "Técnico Test",
            email: "tecnico@ejemplo.com",
            password: "********",
            rol: "tecnico",
            permisos: {
              dashboard: true,
              actividades: true,
              itrb: true,
              proyectos: false,
              reportes: true,
              configuracion: false
            },
            activo: true,
            fechaCreacion: "2023-02-20T14:15:00Z",
            ultimoAcceso: "2023-05-10T09:45:00Z"
          },
          {
            id: "user-3",
            nombre: "Visualizador",
            email: "viewer@ejemplo.com",
            password: "********",
            rol: "viewer",
            permisos: {
              dashboard: true,
              actividades: true,
              itrb: false,
              proyectos: false,
              reportes: false,
              configuracion: false
            },
            activo: true,
            fechaCreacion: "2023-03-05T11:20:00Z",
            ultimoAcceso: "2023-05-09T16:30:00Z"
            }
        ];
        setUsers(mockUsers);
      }
    }
    
    loadUsers();
  }, []);
  
  // Guardar usuarios en almacenamiento persistente cuando cambian
  useEffect(() => {
    if (users.length > 0) {
      // Convertir array a objeto por email
      const usersObject = users.reduce((acc, user) => {
        acc[user.email.toLowerCase()] = {
          ...user,
          role: user.rol // Asegurar compatibilidad con formato de AppContext
        };
        return acc;
      }, {} as {[email: string]: any});
      
      PersistentStorage.updateUser(user?.email, usersObject);
    }
  }, [users]);
  
  // Función para añadir usuario
  const handleAddUser = () => {
    if (!newUser.nombre || !newUser.email || !newUser.password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    
    // Validar email
    if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      toast.error("El email no es válido");
      return;
    }
    
    // Verificar si el email ya existe
    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      toast.error("Ya existe un usuario con este email");
      return;
    }
    
    const newUserComplete: AppUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newUser,
      activo: true,
      fechaCreacion: new Date().toISOString()
    };
    
    setUsers([...users, newUserComplete]);
    setShowAddUserDialog(false);
    resetNewUserForm();
    toast.success("Usuario creado exitosamente");
  };
  
  // Función para editar usuario
  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };
  
  // Función para abrir diálogo de cambio de contraseña
  const handlePasswordChange = (user: AppUser) => {
    setSelectedUser(user);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswordDialog(true);
  };
  
  // Función para guardar edición
  const handleSaveEdit = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(u => 
      u.id === selectedUser.id ? selectedUser : u
    ));
    
    setShowEditUserDialog(false);
    setSelectedUser(null);
    toast.success("Usuario actualizado exitosamente");
  };
  
  // Función para cambiar contraseña
  const handleSavePassword = async () => {
    if (!selectedUser) return;
    
    // Validaciones
    if (!passwordData.currentPassword) {
      toast.error("La contraseña actual es requerida");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    try {
      // Usar la función del contexto para cambiar contraseña
      const success = await changePassword(
        selectedUser.email,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (success) {
        // Actualizar usuario local
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, password: "********" } // No almacenamos la contraseña real en el estado local
            : u
        ));
        
        setShowPasswordDialog(false);
        setSelectedUser(null);
        toast.success("Contraseña actualizada exitosamente");
      } else {
        toast.error("Contraseña actual incorrecta");
      }
    } catch (error) {
      toast.error("Error al cambiar la contraseña");
      console.error("Error al cambiar contraseña:", error);
    }
  };
  
  // Función para eliminar usuario
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    
    // No permitir eliminar al usuario admin principal
    if (userToDelete?.email.toLowerCase() === "admin@fossil.com") {
      toast.error("No se puede eliminar el usuario administrador principal");
      return;
    }
    
    setUsers(users.filter(u => u.id !== userId));
    toast.success("Usuario eliminado exitosamente");
  };
  
  // Función para activar/desactivar usuario
  const handleToggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    // No permitir desactivar al usuario admin principal
    if (user?.email.toLowerCase() === "admin@fossil.com" && user.activo) {
      toast.error("No se puede desactivar el usuario administrador principal");
      return;
    }
    
    setUsers(users.map(u => 
      u.id === userId ? { ...u, activo: !u.activo } : u
    ));
    
    toast.success(`Usuario ${user?.activo ? 'desactivado' : 'activado'} exitosamente`);
  };
  
  // Resetear formulario
  const resetNewUserForm = () => {
    setNewUser({
      nombre: "",
      email: "",
      password: "",
      rol: "viewer",
      permisos: {
        dashboard: true,
        actividades: false,
        itrb: false,
        proyectos: false,
        reportes: false,
        configuracion: false
      }
    });
  };
  
  // Actualizar permisos
  const handlePermissionChange = (permission: keyof UserPermission, value: boolean) => {
    if (selectedUser) {
      setSelectedUser({
        ...selectedUser,
        permisos: {
          ...selectedUser.permisos,
          [permission]: value
        }
      });
    } else {
      setNewUser({
        ...newUser,
        permisos: {
          ...newUser.permisos,
          [permission]: value
        }
      });
    }
  };
  
  // Función para cambiar rol
  const handleRoleChange = (rol: "admin" | "tecnico" | "viewer") => {
    if (selectedUser) {
      // Permisos predeterminados según rol
      let permisos = { ...selectedUser.permisos };
      
      if (rol === "admin") {
        permisos = {
          dashboard: true,
          actividades: true,
          itrb: true,
          proyectos: true,
          reportes: true,
          configuracion: true
        };
      } else if (rol === "tecnico") {
        permisos = {
          dashboard: true,
          actividades: true,
          itrb: true,
          proyectos: false,
          reportes: true,
          configuracion: false
        };
      } else {
        permisos = {
          dashboard: true,
          actividades: true,
          itrb: false,
          proyectos: false,
          reportes: false,
          configuracion: false
        };
      }
      
      setSelectedUser({
        ...selectedUser,
        rol,
        permisos
      });
    } else {
      // Para nuevo usuario
      let permisos = { ...newUser.permisos };
      
      if (rol === "admin") {
        permisos = {
          dashboard: true,
          actividades: true,
          itrb: true,
          proyectos: true,
          reportes: true,
          configuracion: true
        };
      } else if (rol === "tecnico") {
        permisos = {
          dashboard: true,
          actividades: true,
          itrb: true,
          proyectos: false,
          reportes: true,
          configuracion: false
        };
      } else {
        permisos = {
          dashboard: true,
          actividades: true,
          itrb: false,
          proyectos: false,
          reportes: false,
          configuracion: false
        };
      }
      
      setNewUser({
        ...newUser,
        rol,
        permisos
      });
    }
  };
  
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground py-10">
            No tienes permisos para acceder a esta sección
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Administra los usuarios y sus permisos de acceso</CardDescription>
        </div>
        <Button onClick={() => setShowAddUserDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </CardHeader>
      
      <CardContent>
        {users.length > 0 ? (
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className={`border rounded-md p-4 ${!user.activo ? 'bg-gray-100 dark:bg-gray-800 opacity-70' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      user.rol === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' :
                      user.rol === 'tecnico' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        {user.nombre}
                        {!user.activo && <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">Inactivo</span>}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.rol === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          user.rol === 'tecnico' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {user.rol === 'admin' ? 'Administrador' : user.rol === 'tecnico' ? 'Técnico' : 'Visualizador'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePasswordChange(user)}
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Contraseña
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {user.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <UserMinus className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente el usuario <strong>{user.nombre}</strong>.
                            Esta acción no puede deshacerse.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {user.permisos.dashboard && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    Dashboard
                  </div>
                  <div className="flex items-center gap-1">
                    {user.permisos.actividades && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    Actividades
                  </div>
                  <div className="flex items-center gap-1">
                    {user.permisos.itrb && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    ITR B
                  </div>
                  <div className="flex items-center gap-1">
                    {user.permisos.proyectos && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    Proyectos
                  </div>
                  <div className="flex items-center gap-1">
                    {user.permisos.reportes && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    Reportes
                  </div>
                  <div className="flex items-center gap-1">
                    {user.permisos.configuracion && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    Configuración
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  Creado: {new Date(user.fechaCreacion).toLocaleDateString()}
                  {user.ultimoAcceso && ` · Último acceso: ${new Date(user.ultimoAcceso).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No hay usuarios configurados</p>
            <Button className="mt-4" onClick={() => setShowAddUserDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Añadir Primer Usuario
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Diálogo para añadir usuario */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea una nueva cuenta de usuario para el sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input 
                  id="nombre" 
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="usuario@empresa.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input 
                id="password" 
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Contraseña segura"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rol del Usuario</Label>
              <div className="flex space-x-4 mt-1">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="rol-admin"
                    name="rol"
                    className="h-4 w-4 text-indigo-600"
                    checked={newUser.rol === "admin"}
                    onChange={() => handleRoleChange("admin")}
                  />
                  <Label htmlFor="rol-admin" className="ml-2">Administrador</Label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="rol-tecnico"
                    name="rol"
                    className="h-4 w-4 text-indigo-600"
                    checked={newUser.rol === "tecnico"}
                    onChange={() => handleRoleChange("tecnico")}
                  />
                  <Label htmlFor="rol-tecnico" className="ml-2">Técnico</Label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="rol-viewer"
                    name="rol"
                    className="h-4 w-4 text-indigo-600"
                    checked={newUser.rol === "viewer"}
                    onChange={() => handleRoleChange("viewer")}
                  />
                  <Label htmlFor="rol-viewer" className="ml-2">Visualizador</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Permisos</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-start">
                  <Checkbox 
                    id="perm-dashboard"
                    checked={newUser.permisos.dashboard}
                    onCheckedChange={(checked) => handlePermissionChange("dashboard", checked as boolean)}
                  />
                  <div className="ml-2">
                    <Label htmlFor="perm-dashboard">Dashboard</Label>
                    <p className="text-xs text-muted-foreground">Acceso al dashboard principal</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Checkbox 
                    id="perm-actividades"
                    checked={newUser.permisos.actividades}
                    onCheckedChange={(checked) => handlePermissionChange("actividades", checked as boolean)}
                  />
                  <div className="ml-2">
                    <Label htmlFor="perm-actividades">Actividades</Label>
                    <p className="text-xs text-muted-foreground">Gestión de actividades</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Checkbox 
                    id="perm-itrb"
                    checked={newUser.permisos.itrb}
                    onCheckedChange={(checked) => handlePermissionChange("itrb", checked as boolean)}
                  />
                  <div className="ml-2">
                    <Label htmlFor="perm-itrb">ITR B</Label>
                    <p className="text-xs text-muted-foreground">Gestión de ITR B</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Checkbox 
                    id="perm-proyectos"
                    checked={newUser.permisos.proyectos}
                    onCheckedChange={(checked) => handlePermissionChange("proyectos", checked as boolean)}
                  />
                  <div className="ml-2">
                    <Label htmlFor="perm-proyectos">Proyectos</Label>
                    <p className="text-xs text-muted-foreground">Gestión de proyectos</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Checkbox 
                    id="perm-reportes"
                    checked={newUser.permisos.reportes}
                    onCheckedChange={(checked) => handlePermissionChange("reportes", checked as boolean)}
                  />
                  <div className="ml-2">
                    <Label htmlFor="perm-reportes">Reportes</Label>
                    <p className="text-xs text-muted-foreground">Generación de reportes</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Checkbox 
                    id="perm-configuracion"
                    checked={newUser.permisos.configuracion}
                    onCheckedChange={(checked) => handlePermissionChange("configuracion", checked as boolean)}
                  />
                  <div className="ml-2">
                    <Label htmlFor="perm-configuracion">Configuración</Label>
                    <p className="text-xs text-muted-foreground">Configuración del sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddUserDialog(false);
              resetNewUserForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar usuario */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información y permisos del usuario
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">Nombre *</Label>
                  <Input 
                    id="edit-nombre" 
                    value={selectedUser.nombre}
                    onChange={(e) => setSelectedUser({...selectedUser, nombre: e.target.value})}
                    placeholder="Nombre completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input 
                    id="edit-email" 
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    placeholder="usuario@empresa.com"
                    disabled
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Rol del Usuario</Label>
                <div className="flex space-x-4 mt-1">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="edit-rol-admin"
                      name="edit-rol"
                      className="h-4 w-4 text-indigo-600"
                      checked={selectedUser.rol === "admin"}
                      onChange={() => handleRoleChange("admin")}
                    />
                    <Label htmlFor="edit-rol-admin" className="ml-2">Administrador</Label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="edit-rol-tecnico"
                      name="edit-rol"
                      className="h-4 w-4 text-indigo-600"
                      checked={selectedUser.rol === "tecnico"}
                      onChange={() => handleRoleChange("tecnico")}
                    />
                    <Label htmlFor="edit-rol-tecnico" className="ml-2">Técnico</Label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="edit-rol-viewer"
                      name="edit-rol"
                      className="h-4 w-4 text-indigo-600"
                      checked={selectedUser.rol === "viewer"}
                      onChange={() => handleRoleChange("viewer")}
                    />
                    <Label htmlFor="edit-rol-viewer" className="ml-2">Visualizador</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Permisos</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-start">
                    <Checkbox 
                      id="edit-perm-dashboard"
                      checked={selectedUser.permisos.dashboard}
                      onCheckedChange={(checked) => handlePermissionChange("dashboard", checked as boolean)}
                    />
                    <div className="ml-2">
                      <Label htmlFor="edit-perm-dashboard">Dashboard</Label>
                      <p className="text-xs text-muted-foreground">Acceso al dashboard principal</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Checkbox 
                      id="edit-perm-actividades"
                      checked={selectedUser.permisos.act
