
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppContext } from "@/context/AppContext";

const ChatbotButton: React.FC = () => {
  const navigate = useNavigate();
  const { apiKeys } = useAppContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      navigate("/ai-assistant");
      setIsClicked(false);
    }, 300);
  };

  const hasApiKey = !!apiKeys?.openAI;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              className={`h-14 w-14 rounded-full shadow-lg ${
                isClicked 
                  ? "scale-95 bg-indigo-700" 
                  : isHovered
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-500 hover:bg-indigo-600"
              } transition-all duration-300 flex items-center justify-center relative`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isHovered ? (
                <div className="flex items-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
              ) : (
                <Bot className="h-6 w-6 text-white" />
              )}
              
              {!hasApiKey && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{hasApiKey ? "Asistente IA" : "Configurar Asistente IA"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ChatbotButton;
