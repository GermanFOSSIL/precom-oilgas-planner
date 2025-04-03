
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Save } from "lucide-react";

interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  onComplete?: () => void;
  children: React.ReactNode;
}

const FormSubmitButton = React.forwardRef<HTMLButtonElement, FormSubmitButtonProps>(
  ({ onClick, onComplete, children, ...props }, ref) => {
    const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
    const [isCompleted, setIsCompleted] = React.useState<boolean>(false);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.disabled || isSubmitting || isCompleted) return;

      setIsSubmitting(true);
      
      try {
        if (onClick) {
          await onClick();
        }
        
        // Display completion animation
        setIsCompleted(true);
        
        // Auto close the dialog after successful save
        setTimeout(() => {
          setIsCompleted(false);
          setIsSubmitting(false);
          
          if (onComplete) {
            onComplete();
          }
        }, 1000);
      } catch (error) {
        setIsSubmitting(false);
        toast.error("Ocurrió un error", {
          description: "No se pudieron guardar los cambios.",
        });
      }
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isSubmitting || props.disabled}
        {...props}
      >
        {isCompleted ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Guardado
          </>
        ) : isSubmitting ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {children}
          </>
        )}
      </Button>
    );
  }
);

FormSubmitButton.displayName = "FormSubmitButton";

export { FormSubmitButton };
