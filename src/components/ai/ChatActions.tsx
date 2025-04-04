
import React from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import AIReportGenerator from "@/components/AIReportGenerator";
import { Message } from "@/types";

interface ChatActionsProps {
  messages: Message[];
  formatTimestamp: (date: Date) => string;
}

const ChatActions: React.FC<ChatActionsProps> = ({ messages, formatTimestamp }) => {
  const handleSendEmail = () => {
    // Preparar el contenido del correo
    const subject = encodeURIComponent("Conversación con Asistente IA");
    const body = encodeURIComponent(
      messages.map(msg => 
        `${msg.role === 'user' ? 'Usuario' : 'Asistente IA'} (${formatTimestamp(msg.timestamp)}):\n${msg.content}\n\n`
      ).join('')
    );
    
    // Abrir el cliente de correo predeterminado
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    toast.success("Preparando email con la conversación...");
  };

  return (
    <div className="flex gap-2 mt-2">
      <AIReportGenerator messages={messages} />
      <Button variant="outline" size="sm" className="text-xs" onClick={handleSendEmail}>
        <Mail className="h-3 w-3 mr-1" />
        Enviar por email
      </Button>
    </div>
  );
};

export default ChatActions;
