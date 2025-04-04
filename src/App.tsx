
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
import UserProfilePage from "./pages/UserProfilePage"; // Nuevo componente que crearemos

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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      {/* Rutas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      
      <Route path="/itr-management" element={
        <ProtectedRoute>
          <ITRManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/ai-assistant" element={
        <ProtectedRoute>
          <AIAssistant />
        </ProtectedRoute>
      } />
      
      <Route path="/test-gantt" element={
        <ProtectedRoute>
          <TestGanttPage />
        </ProtectedRoute>
      } />
      
      {/* Nueva ruta para perfil de usuario */}
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
