
import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import ITRSidebarContent from "@/components/sidebar/ITRSidebarContent";

const TechnicianActions: React.FC<{
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}> = ({ className = "", size = "lg" }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="default" 
          size={size}
          className={`bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2 px-6 py-2 shadow-md ${className}`}
        >
          <ClipboardList className="h-5 w-5" />
          Gestionar ITR
        </Button>
      </SheetTrigger>
      <ITRSidebarContent />
    </Sheet>
  );
};

export default TechnicianActions;
