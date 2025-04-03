
import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Input
} from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KPIConfig } from "@/types";
import { toast } from "sonner";
import { Save, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const kpiOptions = [
  { value: "avanceFisico", label: "Avance Físico" },
  { value: "totalITRB", label: "Total ITR B" },
  { value: "realizadosITRB", label: "ITR B Completados" },
  { value: "actividadesVencidas", label: "ITR B Vencidos" },
  { value: "subsistemasMCC", label: "Subsistemas con MCC" } // Cambiado de CCC a MCC
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
    kpiPersonalizado3: kpiConfig.kpiPersonalizado3 || "subsistemasMCC",
    kpiPersonalizado4: kpiConfig.kpiPersonalizado4 || "actividadesVencidas",
  });
  
  const handleInputChange = (field: keyof KPIConfig, value: string) => {
    setEditedConfig({
      ...editedConfig,
      [field]: value
    });
  };
  
  const handleCheckboxChange = (field: keyof KPIConfig, value: string) => {
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
              
              <div className="mt-4">
                <Label className="mb-2 block">Valor a mostrar</Label>
                <div className="space-y-2">
                  {kpiOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`kpi1-${option.value}`}
                        checked={editedConfig.kpiPersonalizado1 === option.value}
                        onCheckedChange={() => handleCheckboxChange("kpiPersonalizado1", option.value)}
                      />
                      <label 
                        htmlFor={`kpi1-${option.value}`}
                        className="text-sm"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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
              
              <div className="mt-4">
                <Label className="mb-2 block">Valor a mostrar</Label>
                <div className="space-y-2">
                  {kpiOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`kpi2-${option.value}`}
                        checked={editedConfig.kpiPersonalizado2 === option.value}
                        onCheckedChange={() => handleCheckboxChange("kpiPersonalizado2", option.value)}
                      />
                      <label 
                        htmlFor={`kpi2-${option.value}`}
                        className="text-sm"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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
              
              <div className="mt-4">
                <Label className="mb-2 block">Valor a mostrar</Label>
                <div className="space-y-2">
                  {kpiOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`kpi3-${option.value}`}
                        checked={editedConfig.kpiPersonalizado3 === option.value}
                        onCheckedChange={() => handleCheckboxChange("kpiPersonalizado3", option.value)}
                      />
                      <label 
                        htmlFor={`kpi3-${option.value}`}
                        className="text-sm"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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
              
              <div className="mt-4">
                <Label className="mb-2 block">Valor a mostrar</Label>
                <div className="space-y-2">
                  {kpiOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`kpi4-${option.value}`}
                        checked={editedConfig.kpiPersonalizado4 === option.value}
                        onCheckedChange={() => handleCheckboxChange("kpiPersonalizado4", option.value)}
                      />
                      <label 
                        htmlFor={`kpi4-${option.value}`}
                        className="text-sm"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itrVencidosMostrar">
              Visualización de ITR B Vencidos
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencidos-total"
                  checked={editedConfig.itrVencidosMostrar === "total"}
                  onCheckedChange={() => handleCheckboxChange("itrVencidosMostrar", "total")}
                />
                <label htmlFor="vencidos-total" className="text-sm">Total de vencidos</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencidos-diferencia"
                  checked={editedConfig.itrVencidosMostrar === "diferencia"}
                  onCheckedChange={() => handleCheckboxChange("itrVencidosMostrar", "diferencia")}
                />
                <label htmlFor="vencidos-diferencia" className="text-sm">Diferencia (completados - pendientes)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencidos-pendientes"
                  checked={editedConfig.itrVencidosMostrar === "pendientes"}
                  onCheckedChange={() => handleCheckboxChange("itrVencidosMostrar", "pendientes")}
                />
                <label htmlFor="vencidos-pendientes" className="text-sm">Pendientes vencidos</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vencidos-completados"
                  checked={editedConfig.itrVencidosMostrar === "completados"}
                  onCheckedChange={() => handleCheckboxChange("itrVencidosMostrar", "completados")}
                />
                <label htmlFor="vencidos-completados" className="text-sm">Completados fuera de fecha</label>
              </div>
            </div>
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
