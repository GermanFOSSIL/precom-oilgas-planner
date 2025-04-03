
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Input
} from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KPIConfig } from "@/types";
import { toast } from "sonner";
import { Save } from "lucide-react";

const kpiOptions = [
  { value: "avanceFisico", label: "Avance Físico" },
  { value: "totalITRB", label: "Total ITR B" },
  { value: "realizadosITRB", label: "ITR B Completados" },
  { value: "actividadesVencidas", label: "ITR B Vencidos" },
  { value: "subsistemasCCC", label: "Subsistemas con MCC" } // Cambiado de CCC a MCC
];

const KPIConfigManager: React.FC = () => {
  const { kpiConfig, updateKPIConfig } = useAppContext();
  
  const [editedConfig, setEditedConfig] = useState<KPIConfig>({
    ...kpiConfig,
    nombreKPI1: kpiConfig.nombreKPI1 || "Avance Físico",
    nombreKPI2: kpiConfig.nombreKPI2 || "ITR B Completados",
    nombreKPI3: kpiConfig.nombreKPI3 || "Subsistemas con MCC",
    nombreKPI4: kpiConfig.nombreKPI4 || "ITR B Vencidos",
    kpiPersonalizado1: kpiConfig.kpiPersonalizado1 || "avanceFisico",
    kpiPersonalizado2: kpiConfig.kpiPersonalizado2 || "realizadosITRB",
    kpiPersonalizado3: kpiConfig.kpiPersonalizado3 || "subsistemasCCC",
    kpiPersonalizado4: kpiConfig.kpiPersonalizado4 || "actividadesVencidas",
  });
  
  const handleInputChange = (field: keyof KPIConfig, value: string) => {
    setEditedConfig({
      ...editedConfig,
      [field]: value
    });
  };
  
  const handleSelectChange = (field: keyof KPIConfig, value: string) => {
    setEditedConfig({
      ...editedConfig,
      [field]: value
    });
  };
  
  const handleSaveConfig = () => {
    updateKPIConfig(editedConfig);
    toast.success("Configuración de KPIs actualizada", {
      description: "Los cambios se aplicarán a todos los dashboards."
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de KPIs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KPI 1 Configuration */}
            <div className="space-y-2 border p-4 rounded-md">
              <Label htmlFor="kpi1-name">Nombre del KPI 1</Label>
              <Input
                id="kpi1-name"
                value={editedConfig.nombreKPI1 || "Avance Físico"}
                onChange={(e) => handleInputChange("nombreKPI1", e.target.value)}
                placeholder="Nombre del KPI 1"
              />
              
              <Label htmlFor="kpi1-type" className="mt-2">Valor a mostrar</Label>
              <Select
                value={editedConfig.kpiPersonalizado1 || "avanceFisico"}
                onValueChange={(value) => handleSelectChange("kpiPersonalizado1", value)}
              >
                <SelectTrigger id="kpi1-type">
                  <SelectValue placeholder="Seleccionar valor" />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* KPI 2 Configuration */}
            <div className="space-y-2 border p-4 rounded-md">
              <Label htmlFor="kpi2-name">Nombre del KPI 2</Label>
              <Input
                id="kpi2-name"
                value={editedConfig.nombreKPI2 || "ITR B Completados"}
                onChange={(e) => handleInputChange("nombreKPI2", e.target.value)}
                placeholder="Nombre del KPI 2"
              />
              
              <Label htmlFor="kpi2-type" className="mt-2">Valor a mostrar</Label>
              <Select
                value={editedConfig.kpiPersonalizado2 || "realizadosITRB"}
                onValueChange={(value) => handleSelectChange("kpiPersonalizado2", value)}
              >
                <SelectTrigger id="kpi2-type">
                  <SelectValue placeholder="Seleccionar valor" />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* KPI 3 Configuration */}
            <div className="space-y-2 border p-4 rounded-md">
              <Label htmlFor="kpi3-name">Nombre del KPI 3</Label>
              <Input
                id="kpi3-name"
                value={editedConfig.nombreKPI3 || "Subsistemas con MCC"}
                onChange={(e) => handleInputChange("nombreKPI3", e.target.value)}
                placeholder="Nombre del KPI 3"
              />
              
              <Label htmlFor="kpi3-type" className="mt-2">Valor a mostrar</Label>
              <Select
                value={editedConfig.kpiPersonalizado3 || "subsistemasCCC"}
                onValueChange={(value) => handleSelectChange("kpiPersonalizado3", value)}
              >
                <SelectTrigger id="kpi3-type">
                  <SelectValue placeholder="Seleccionar valor" />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* KPI 4 Configuration */}
            <div className="space-y-2 border p-4 rounded-md">
              <Label htmlFor="kpi4-name">Nombre del KPI 4</Label>
              <Input
                id="kpi4-name"
                value={editedConfig.nombreKPI4 || "ITR B Vencidos"}
                onChange={(e) => handleInputChange("nombreKPI4", e.target.value)}
                placeholder="Nombre del KPI 4"
              />
              
              <Label htmlFor="kpi4-type" className="mt-2">Valor a mostrar</Label>
              <Select
                value={editedConfig.kpiPersonalizado4 || "actividadesVencidas"}
                onValueChange={(value) => handleSelectChange("kpiPersonalizado4", value)}
              >
                <SelectTrigger id="kpi4-type">
                  <SelectValue placeholder="Seleccionar valor" />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itrVencidosMostrar">
              Visualización de ITR B Vencidos
            </Label>
            <Select 
              value={editedConfig.itrVencidosMostrar}
              onValueChange={(value) => handleSelectChange("itrVencidosMostrar", value)}
            >
              <SelectTrigger id="itrVencidosMostrar" className="w-full">
                <SelectValue placeholder="Seleccionar visualización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total de vencidos</SelectItem>
                <SelectItem value="diferencia">Diferencia (completados - pendientes)</SelectItem>
                <SelectItem value="pendientes">Pendientes vencidos</SelectItem>
                <SelectItem value="completados">Completados fuera de fecha</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Seleccione qué dato desea ver destacado en el KPI de ITR B Vencidos
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
        
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm">
          <p>Estas configuraciones permiten personalizar qué datos se muestran en los KPIs del dashboard.</p>
          <p className="mt-1">Puede cambiar tanto los nombres como los valores mostrados en cada indicador.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPIConfigManager;
