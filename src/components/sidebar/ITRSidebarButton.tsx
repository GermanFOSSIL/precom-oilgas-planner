
import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

interface ITRSidebarButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const ITRSidebarButton: React.FC<ITRSidebarButtonProps> = ({ 
  className = "", 
  size = "default" 
}) => {
  return (
    <Button 
      variant="default" 
      size={size}
      className={`bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 ${className}`}
    >
      <ClipboardList className="h-4 w-4" />
      Gestionar ITR
    </Button>
  );
};

export default ITRSidebarButton;
