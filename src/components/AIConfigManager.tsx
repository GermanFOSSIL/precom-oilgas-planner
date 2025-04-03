
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Save, Bot } from "lucide-react";
import { toast } from "sonner";

const AIConfigManager: React.FC = () => {
  const { apiKeys, updateAPIKeys } = useAppContext();
  const [openAIKey, setOpenAIKey] = useState(apiKeys?.openAI || "");
  const [aiModel, setAIModel] = useState(apiKeys?.aiModel || "gpt-4o");
  const [showKey, setShowKey] = useState(false);
  
  const handleSaveConfig = () => {
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
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex">
              <Input 
                id="api-key"
                type={showKey ? "text" : "password"}
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..." 
                className="flex-1"
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
