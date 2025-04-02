
import React from "react";
import { AppProvider } from "@/context/AppContext";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";
import { useAppContext } from "@/context/AppContext";

// Contenedor que verifica si hay un usuario autenticado
const AppContainer: React.FC = () => {
  const { user } = useAppContext();
  
  return user ? <Dashboard /> : <Login />;
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
};

export default Index;
