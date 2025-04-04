
import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Download, Mail, Bot } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import AIConfigManager from "@/components/AIConfigManager";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { user, isAdmin, apiKeys, proyectos, actividades } = useAppContext();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "¡Hola! Soy tu asistente IA para el plan de precomisionado. Puedo ayudarte a generar informes, analizar datos de tus proyectos y más. ¿En qué puedo ayudarte hoy?",
          timestamp: new Date()
        }
      ]);
    }
  }, [messages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    // Check if OpenAI API key is configured
    if (!apiKeys?.openAI) {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "No se ha configurado una API key de OpenAI. Por favor, configura la API key en la sección 'Configuración IA' para usar el asistente.",
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    try {
      // Prepare context data for the AI
      const contextData = {
        proyectos: proyectos.slice(0, 5).map(p => ({
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          estado: p.estado
        })),
        actividadesCount: actividades.length,
        sistemasCount: new Set(actividades.map(a => a.sistema)).size,
      };
      
      // Prepare conversation history for the API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add user's new message
      conversationHistory.push({
        role: "user",
        content: input
      });
      
      // System message with instructions
      const systemMessage = {
        role: "system",
        content: `Eres un asistente AI especializado en planes de precomisionado y gestión de ITRs (Inspection and Test Records). Ayudas a analizar datos de proyectos y a responder preguntas técnicas. Contexto actual del proyecto: ${JSON.stringify(contextData)}`
      };
      
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeys.openAI}`
        },
        body: JSON.stringify({
          model: apiKeys.aiModel || "gpt-4o",
          messages: [systemMessage, ...conversationHistory],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenAI API error:", errorData);
        throw new Error(`Error al llamar a OpenAI: ${response.status} ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      const assistantResponse = data.choices[0]?.message?.content || "Lo siento, no pude procesar tu solicitud.";
      
      // Add assistant response to messages
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: assistantResponse,
          timestamp: new Date()
        }
      ]);
      
    } catch (error) {
      console.error("Error al procesar el mensaje:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Error al procesar el mensaje"}`);
      
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, verifica tu API key e inténtalo de nuevo.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleGenerateReport = () => {
    toast("Generando informe en base a la conversación...");
    // Implementación real conectaría con OpenAI para generar un informe
    // basado en el contenido de la conversación
  };
  
  const handleSendEmail = () => {
    toast("Preparando email con la conversación...");
    // Implementación real permitiría enviar la conversación por email
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-500" />
                Asistente IA
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" 
                            ? "bg-indigo-500 text-white" 
                            : "bg-gray-100 dark:bg-slate-800"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs text-right mt-1 opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-slate-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t dark:border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={handleSendMessage} disabled={loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleGenerateReport}>
                    <Download className="h-3 w-3 mr-1" />
                    Generar informe
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleSendEmail}>
                    <Mail className="h-3 w-3 mr-1" />
                    Enviar por email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <AIConfigManager />
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
