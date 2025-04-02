
import React from "react";
import { AppProvider } from "@/context/AppContext";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";
import AdminPanel from "@/components/AdminPanel";
import PublicDashboard from "@/components/PublicDashboard";
import { useAppContext } from "@/context/AppContext";

// Contenedor que determina qué componente mostrar según el estado de autenticación
const AppContainer: React.FC = () => {
  const { user, isAdmin, isTecnico } = useAppContext();
  
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
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
};

export default Index;
