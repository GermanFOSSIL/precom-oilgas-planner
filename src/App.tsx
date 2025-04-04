
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { CompatibilityProvider } from "@/context/CompatibilityLayer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ITRManagement from "./pages/ITRManagement";
import LoginPage from "./pages/LoginPage";
import AIAssistant from "./pages/AIAssistant";
import TestGanttPage from "./pages/TestGanttPage";
import ProyectoManager from "./pages/ProyectoManager";
import ChatbotButton from "./components/ChatbotButton";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <CompatibilityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/itr-management" element={<ITRManagement />} />
                <Route path="/proyecto-manager" element={<ProyectoManager />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/test-gantt" element={<TestGanttPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatbotButton />
            </BrowserRouter>
          </TooltipProvider>
        </CompatibilityProvider>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
