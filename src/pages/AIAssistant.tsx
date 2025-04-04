
import React, { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AIConfigManager from "@/components/AIConfigManager";
import ChatInterface from "@/components/ai/ChatInterface";
import { useAIChat } from "@/hooks/useAIChat";

const AIAssistant: React.FC = () => {
  const { user, apiKeys, proyectos, actividades, itrbItems } = useAppContext();
  const navigate = useNavigate();
  
  // Custom hook to handle AI chat functionality
  const { messages, loading, handleSendMessage } = useAIChat({
    apiKeys,
    user,
    proyectos,
    actividades,
    itrbItems
  });
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ChatInterface
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
          />
        </div>
        
        <div className="lg:col-span-1">
          <AIConfigManager />
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
