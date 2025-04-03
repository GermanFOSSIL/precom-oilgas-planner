
import React, { useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import AdminPanel from "@/components/AdminPanel";
import PublicDashboard from "@/components/PublicDashboard";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Contenedor que determina qué componente mostrar según el estado de autenticación
const AppContainer: React.FC = () => {
  const { user, isAdmin, isTecnico, logout } = useAppContext();
  const navigate = useNavigate();
  
  // Verificar autenticación cada vez que se monta el componente
  useEffect(() => {
    // Check localStorage for stale data
    const lastSession = localStorage.getItem("lastSession");
    const now = Date.now();
    
    if (lastSession) {
      const sessionTime = parseInt(lastSession, 10);
      const hoursPassed = (now - sessionTime) / (1000 * 60 * 60);
      
      // If session is older than 4 hours, force logout
      if (hoursPassed > 4) {
        logout();
        toast.info("La sesión ha expirado, por favor inicie sesión nuevamente.");
        navigate('/login');
      }
    }
    
    // Update last session time
    localStorage.setItem("lastSession", now.toString());
  }, [logout, navigate]);
  
  // Si no hay usuario autenticado, mostrar el dashboard público
  if (!user) {
    return <PublicDashboard />;
  }
  
  // Si es admin o técnico, mostrar el panel administrativo
  if (isAdmin || isTecnico) {
    return <AdminPanel />;
  }
  
  // Para usuarios con rol "viewer" mostrar el dashboard con funcionalidades limitadas
  return <Dashboard />;
};

const Index: React.FC = () => {
  return <AppContainer />;
};

export default Index;
