
import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Download, Mail, BrainCog, Bot } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: string;
}

const AIAssistant: React.FC = () => {
  const { user, apiKeys, actividades, itrbItems, proyectos } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hola, soy tu asistente de IA para el sistema de Pre-Comisionado. ¿En qué puedo ayudarte hoy?",
      sender: "assistant",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Autoscroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Verificar si hay una API key configurada
    if (!apiKeys.openAI) {
      toast.error("No se ha configurado una API key para OpenAI", {
        description: "Por favor, configúrela en la sección de Configuración.",
      });
      return;
    }

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Aquí construimos el contexto con datos del sistema
      const context = {
        actividadesCount: actividades.length,
        proyectosCount: proyectos.length,
        itrbItemsCount: itrbItems.length,
        completedITRBCount: itrbItems.filter(item => item.cantidadRealizada === item.cantidadTotal).length,
        pendingITRBCount: itrbItems.filter(item => item.cantidadRealizada < item.cantidadTotal).length,
      };

      // Simulamos una respuesta de IA (en un entorno real, esto sería una llamada a la API de OpenAI)
      // En una implementación real, enviaríamos el contexto y el mensaje a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generamos una respuesta basada en el mensaje y el contexto
      let responseContent = "";
      
      if (inputMessage.toLowerCase().includes("reporte") || inputMessage.toLowerCase().includes("informe")) {
        responseContent = `Claro, puedo generar un informe basado en los datos actuales:\n\n**Resumen del Sistema**:\n- Total de Proyectos: ${context.proyectosCount}\n- Total de Actividades: ${context.actividadesCount}\n- Total de ITR B: ${context.itrbItemsCount}\n- ITR B Completados: ${context.completedITRBCount}\n- ITR B Pendientes: ${context.pendingITRBCount}\n\nPuedes exportar este informe como PDF o solicitar enviarlo por correo electrónico.`;
      } else if (inputMessage.toLowerCase().includes("actividad") || inputMessage.toLowerCase().includes("actividades")) {
        responseContent = `Actualmente hay ${context.actividadesCount} actividades registradas en el sistema. ¿Te gustaría ver un desglose por proyecto o sistema?`;
      } else if (inputMessage.toLowerCase().includes("itr") || inputMessage.toLowerCase().includes("itrs")) {
        responseContent = `Hay ${context.itrbItemsCount} ITR B en el sistema, de los cuales ${context.completedITRBCount} están completados y ${context.pendingITRBCount} están pendientes. ¿Necesitas información sobre algún ITR B específico?`;
      } else if (inputMessage.toLowerCase().includes("correo") || inputMessage.toLowerCase().includes("email")) {
        responseContent = "Puedo ayudarte a enviar informes por correo electrónico. ¿A qué dirección quieres enviarlo y qué tipo de informe necesitas?";
      } else {
        responseContent = "Entiendo tu consulta. Como asistente de IA integrado con el sistema de Pre-Comisionado, puedo ayudarte con reportes, análisis de actividades, seguimiento de ITR B, envío de informes por correo y mucho más. ¿Hay algo específico en lo que necesites profundizar?";
      }
      
      const newAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: responseContent,
        sender: "assistant",
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      toast.error("Error al comunicarse con la IA", {
        description: "Por favor, inténtelo de nuevo más tarde.",
      });
      console.error("Error en la comunicación con la IA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateReport = () => {
    toast.success("Generando reporte...");
    // Aquí iría la lógica para generar un reporte basado en la conversación
  };

  const handleSendEmail = () => {
    toast.success("Preparando para enviar por correo...");
    // Aquí iría la lógica para enviar la conversación por correo
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header title="Asistente IA" />
      
      <main className="container mx-auto p-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-500" />
                  Asistente IA de Pre-Comisionado
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col">
                <ScrollArea className="flex-1 p-4 mb-4 border rounded-md">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 dark:bg-slate-800 dark:text-white"
                          }`}
                        >
                          <p className="whitespace-pre-line">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleGenerateReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSendEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Correo
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sugerencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => setInputMessage("Genera un reporte de avance de actividades")}
                >
                  Reporte de avance de actividades
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => setInputMessage("¿Cuántos ITR B están pendientes?")}
                >
                  ¿Cuántos ITR B están pendientes?
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => setInputMessage("Envía un informe semanal por correo")}
                >
                  Enviar informe semanal por correo
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => setInputMessage("Analiza el rendimiento del proyecto actual")}
                >
                  Analizar rendimiento del proyecto
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
