
import { useState, useEffect } from "react";
import { Message } from "@/types";
import { toast } from "sonner";
import ApiKeyStorage from "@/services/ApiKeyStorage";
import { APIKeys } from "@/types";

interface UseAIChatProps {
  apiKeys?: APIKeys;
  user: any;
  proyectos: any[];
  actividades: any[];
  itrbItems: any[];
}

export const useAIChat = ({ apiKeys, user, proyectos, actividades, itrbItems }: UseAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, [messages.length]);

  const handleSendMessage = async (input: string) => {
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    // Intentar cargar la API key desde almacenamiento si no está disponible en el contexto
    let openAIKey = apiKeys?.openAI;
    if (!openAIKey) {
      openAIKey = ApiKeyStorage.getApiKey();
    }
    
    // Check if OpenAI API key is configured
    if (!openAIKey) {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "No se ha configurado una API key de OpenAI. Por favor, contacta a un administrador para configurar la API key.",
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    try {
      // Extract relevant systems and subsystems from activities
      const systems = [...new Set(actividades.map(a => a.sistema))];
      const subsystems = [...new Set(actividades.map(a => `${a.sistema}-${a.subsistema}`))];
      
      // Extract ITR data
      const itrData = itrbItems.slice(0, 10).map(itr => {
        const relatedActivity = actividades.find(a => a.id === itr.actividadId);
        return {
          id: itr.id,
          descripcion: itr.descripcion,
          estado: itr.estado,
          fechaLimite: itr.fechaLimite,
          cantidadRealizada: itr.cantidadRealizada,
          cantidadTotal: itr.cantidadTotal,
          sistema: relatedActivity ? relatedActivity.sistema : 'No encontrado',
          subsistema: relatedActivity ? relatedActivity.subsistema : 'No encontrado'
        };
      });
      
      // Prepare context data for the AI with expanded information
      const contextData = {
        proyectos: proyectos.slice(0, 5).map(p => ({
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion
        })),
        usuarios: user ? [{ nombre: user.nombre, role: user.role }] : [],
        sistemas: systems,
        subsistemas: subsystems.slice(0, 10), // Limit to avoid token overload
        itrResumen: {
          total: itrbItems.length,
          completados: itrbItems.filter(i => i.estado === "Completado").length,
          enCurso: itrbItems.filter(i => i.estado === "En curso").length,
          vencidos: itrbItems.filter(i => i.estado === "Vencido").length
        },
        itrEjemplos: itrData,
        actividadesCount: actividades.length,
        sistemasCount: systems.length,
        fechaActual: new Date().toISOString()
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
      
      // System message with enhanced instructions and context
      const systemMessage = {
        role: "system",
        content: `Eres un asistente AI especializado en planes de precomisionado y gestión de ITRs (Inspection and Test Records). 
        
Tienes acceso a información sobre los proyectos, sistemas, subsistemas y estado de ITRs. Utiliza esta información para dar respuestas más precisas y contextualizadas.

Puedes responder preguntas como:
- Estado general de los proyectos
- Información sobre sistemas y subsistemas
- Estado de los ITRs (completados, en curso, vencidos)
- Fechas límite de ITRs
- Información sobre avances y pendientes

Contexto actual del proyecto: ${JSON.stringify(contextData)}`
      };
      
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: apiKeys?.aiModel || "gpt-4o",
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

  return {
    messages,
    loading,
    handleSendMessage
  };
};
