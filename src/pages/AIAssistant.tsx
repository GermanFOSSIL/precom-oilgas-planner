
import React, { useState, useEffect } from "react";
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
  const { user, isAdmin, apiKeys } = useAppContext();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
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
      // Simulate AI response - in a real implementation, this would call the OpenAI API
      // For demo purposes, we'll just use a timeout
      setTimeout(() => {
        const botResponse = {
          role: "assistant" as const,
          content: `He recibido tu mensaje: "${input}". En una implementación real, esto llamaría a la API de OpenAI para generar una respuesta basada en los datos de tu proyecto.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
        setLoading(false);
      }, 1500);
      
      // In a real implementation, you would call OpenAI API here
      // const response = await fetch('https://api.openai.com/v1/chat/completions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiKeys.openAI}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     model: apiKeys.aiModel || 'gpt-4o',
      //     messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      //     max_tokens: 1000
      //   })
      // });
      
      // if (!response.ok) throw new Error('Error al llamar a OpenAI');
      
      // const responseData = await response.json();
      // const botMessage = responseData.choices[0].message.content;
      
      // setMessages(prev => [...prev, {
      //   role: "assistant",
      //   content: botMessage,
      //   timestamp: new Date()
      // }]);
      
    } catch (error) {
      console.error("Error al procesar el mensaje:", error);
      toast.error("Error al procesar el mensaje. Inténtalo de nuevo.");
      
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
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
                        <div className="text-sm">{message.content}</div>
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
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t dark:border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={handleSendMessage} disabled={loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Generar informe
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
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
