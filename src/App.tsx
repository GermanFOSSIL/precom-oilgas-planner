
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { useAppContext } from "@/context/AppContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ITRManagement from "./pages/ITRManagement";
import LoginPage from "./pages/LoginPage";
import AIAssistant from "./pages/AIAssistant";
import TestGanttPage from "./pages/TestGanttPage";
import ChatbotButton from "./components/ChatbotButton";
import UserProfilePage from "./pages/UserProfilePage";
import ITRSidebar from "./components/sidebar/ITRSidebar";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente que protege rutas requiriendo autenticación
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAppContext();
  const location = useLocation();

  // Si el usuario no está autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Componente que redirige usuarios ya autenticados desde login
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAppContext();
  const location = useLocation();

  // Si el usuario ya está autenticado y está intentando ir a login, redirigirlo a home
  if (user && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente que muestra el contenido principal con el ITR Sidebar para usuarios autenticados
const ProtectedRouteWithSidebar = ({ children }: { children: JSX.Element }) => {
  const { user } = useAppContext();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      {children}
    </>
  );
};

// Componente para renderizar el ITR Sidebar solo cuando sea necesario
const WithITRSidebar = () => {
  const { user } = useAppContext();
  return user ? <ITRSidebar /> : null;
};

const AppRoutes = () => {
  return (
    <>
      <WithITRSidebar />
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />

        {/* Rutas protegidas */}
        <Route path="/" element={
          <ProtectedRouteWithSidebar>
            <Index />
          </ProtectedRouteWithSidebar>
        } />
        
        <Route path="/itr-management" element={
          <ProtectedRouteWithSidebar>
            <ITRManagement />
          </ProtectedRouteWithSidebar>
        } />
        
        <Route path="/ai-assistant" element={
          <ProtectedRouteWithSidebar>
            <AIAssistant />
          </ProtectedRouteWithSidebar>
        } />
        
        <Route path="/test-gantt" element={
          <ProtectedRouteWithSidebar>
            <TestGanttPage />
          </ProtectedRouteWithSidebar>
        } />
        
        <Route path="/user-profile" element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Ruta para NotFound también protegida */}
        <Route path="*" element={
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
            <ChatbotButton />
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
