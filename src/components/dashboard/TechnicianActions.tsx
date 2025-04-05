
import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ITRModalContent from "@/components/sidebar/ITRModalContent";

const TechnicianActions: React.FC<{
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}> = ({ className = "", size = "default" }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size={size}
          className={`bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 ${className}`}
        >
          <ClipboardList className="h-4 w-4" />
          Gestionar ITR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] overflow-auto">
        <ITRModalContent />
      </DialogContent>
    </Dialog>
  );
};

export default TechnicianActions;
