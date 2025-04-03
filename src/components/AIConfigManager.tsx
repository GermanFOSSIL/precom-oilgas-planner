
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Bot, Key, AlertCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const AIConfigManager: React.FC = () => {
  const { apiKeys, updateAPIKeys } = useAppContext();
  
  const [openAIKey, setOpenAIKey] = useState(apiKeys.openAI || "");
  const [selectedAIModel, setSelectedAIModel] = useState(apiKeys.aiModel || "gpt-4o");
  const [isHidden, setIsHidden] = useState(true);
  
  const handleSaveConfig = () => {
    updateAPIKeys({
      openAI: openAIKey,
      aiModel: selectedAIModel
    });
    
    toast.success("Configuración de IA actualizada", {
      description: "La API key ha sido guardada correctamente."
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-500" />
          Configuración de Inteligencia Artificial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="info" className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            Configure su API key de OpenAI para habilitar las funcionalidades de asistente IA y generación automática de informes.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key" className="flex items-center gap-1">
              <Key className="h-4 w-4" />
              API Key de OpenAI
            </Label>
            <div className="relative">
              <Input
                id="openai-key"
                type={isHidden ? "password" : "text"}
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="pr-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7"
                onClick={() => setIsHidden(!isHidden)}
              >
                {isHidden ? "Mostrar" : "Ocultar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Puedes obtener tu API key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">platform.openai.com/api-keys</a>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ai-model">Modelo de IA</Label>
            <Select 
              value={selectedAIModel} 
              onValueChange={setSelectedAIModel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona el modelo que deseas utilizar. Modelos más avanzados pueden generar respuestas más precisas pero tienen un costo mayor.
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleSaveConfig} 
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p>Esta API key se almacena localmente en su navegador y se utiliza únicamente para realizar solicitudes a OpenAI para el asistente IA.</p>
          <p className="mt-1">No se comparte con ningún tercero ni se guarda en nuestros servidores.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIConfigManager;
