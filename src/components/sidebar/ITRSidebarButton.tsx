
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ClipboardIcon } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import ITRSidebarContent from "./ITRSidebarContent";

const ITRSidebarButton: React.FC = () => {
  const { user } = useAppContext();
  
  // Check if user has permission to manage ITRs and is admin (not technician)
  const hasPermission = user && user.role === "tecnico";
  
  if (!hasPermission) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed left-0 top-1/2 -translate-y-1/2 p-2 rounded-r-md border-l-0 bg-white dark:bg-slate-800 shadow-md z-30"
          title="Gestionar ITRs"
        >
          <ClipboardIcon className="h-5 w-5 text-blue-600" />
          <span className="sr-only">Gestionar ITRs</span>
        </Button>
      </SheetTrigger>
      <ITRSidebarContent />
    </Sheet>
  );
};

export default ITRSidebarButton;
