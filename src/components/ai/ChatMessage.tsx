
import React from "react";
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  formatTimestamp: (date: Date) => string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, formatTimestamp }) => {
  return (
    <div 
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
  );
};

export default ChatMessage;
