
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Save, Bot, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const AIConfigManager: React.FC = () => {
  const { apiKeys, updateAPIKeys } = useAppContext();
  const [openAIKey, setOpenAIKey] = useState(apiKeys?.openAI || "");
  const [aiModel, setAIModel] = useState(apiKeys?.aiModel || "gpt-4o");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Reset validation state when key changes
    if (openAIKey !== apiKeys?.openAI) {
      setIsKeyValid(null);
    }
  }, [openAIKey, apiKeys]);
  
  const validateAPIKey = async () => {
    if (!openAIKey.startsWith('sk-')) {
      toast.error("La API key debe comenzar con 'sk-'");
      setIsKeyValid(false);
      return false;
    }
    
    setIsValidating(true);
    
    try {
      // Call OpenAI's models endpoint to validate the key
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${openAIKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        setIsKeyValid(true);
        toast.success("API key de OpenAI validada correctamente");
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API key validation error:", errorData);
        toast.error(`API key inválida: ${errorData.error?.message || 'Error de validación'}`);
        setIsKeyValid(false);
        return false;
      }
    } catch (error) {
      console.error("Error validando API key:", error);
      toast.error("Error al validar la API key. Comprueba tu conexión a internet.");
      setIsKeyValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleSaveConfig = async () => {
    if (openAIKey && !isKeyValid && isKeyValid !== null) {
      toast.error("La API key no es válida. Corrige la key antes de guardar.");
      return;
    }
    
    let keyValid = isKeyValid;
    
    // If we have a key and haven't validated it yet, validate now
    if (openAIKey && isKeyValid === null) {
      keyValid = await validateAPIKey();
      if (!keyValid) return;
    }
    
    updateAPIKeys({
      openAI: openAIKey,
      aiModel
    });
    
    toast.success("Configuración de IA guardada correctamente");
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-500" />
          Configuración IA
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-900">
          <AlertDescription>
            Configura tu API key de OpenAI para habilitar el asistente IA.
            La API key se guarda solo en tu navegador y no se comparte con nadie.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-1">
              OpenAI API Key
              {isKeyValid === true && <Check size={16} className="text-green-500" />}
              {isKeyValid === false && <AlertCircle size={16} className="text-red-500" />}
            </Label>
            <div className="flex">
              <Input 
                id="api-key"
                type={showKey ? "text" : "password"}
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..." 
                className={`flex-1 ${isKeyValid === false ? 'border-red-500' : ''}`}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowKey(!showKey)}
                type="button"
                className="ml-2"
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Obtén tu API key en {" "}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </p>
            {openAIKey && isKeyValid === null && (
              <Button
                variant="outline"
                size="sm"
                onClick={validateAPIKey}
                disabled={isValidating || !openAIKey}
                className="mt-2"
              >
                {isValidating ? "Validando..." : "Validar API key"}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ai-model">Modelo de IA</Label>
            <Select value={aiModel} onValueChange={setAIModel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="default" 
            className="w-full"
            onClick={handleSaveConfig}
            disabled={isValidating}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIConfigManager;
