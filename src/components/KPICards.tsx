
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, FileText, AlertTriangle, ArrowUpFromLine, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface KPICardsProps {
  proyectoId?: string;
}

const KPICards: React.FC<KPICardsProps> = ({ proyectoId }) => {
  const { getKPIs, itrbItems, actividades, kpiConfig } = useAppContext();
  
  const kpis = getKPIs(proyectoId);
  
  // Formato para porcentajes
  const formatPercentage = (value: number): string => {
    return value.toFixed(1) + '%';
  };
  
  // Calculo del porcentaje de avance
  const avancePorcentaje = kpis.totalITRB > 0 
    ? Math.round((kpis.realizadosITRB / kpis.totalITRB) * 100)
    : 0;
  
  // Data para el gráfico de avance
  const avanceData = [
    { name: 'Completado', value: kpis.realizadosITRB },
    { name: 'Pendiente', value: kpis.totalITRB - kpis.realizadosITRB },
  ];
  
  // Data para el gráfico de MCC
  const mccData = [
    { name: 'Con MCC', value: kpis.subsistemasMCC },
    { name: 'Sin MCC', value: kpis.totalSubsistemas - kpis.subsistemasMCC },
  ];
  
  // Calcular ITRBs vencidos completados vs faltantes
  const itrbsVencidos = itrbItems.filter(item => {
    // Verificar si pertenece al proyecto seleccionado
    if (proyectoId) {
      const actividad = actividades.find(a => a.id === item.actividadId);
      if (!actividad || actividad.proyectoId !== proyectoId) return false;
    }
    
    // Verificar si está vencido - considerar tanto los marcados como "Vencido" como los que tienen fecha límite pasada
    const fechaLimite = new Date(item.fechaLimite);
    const hoy = new Date();
    return fechaLimite < hoy; // Es vencido si fecha límite es anterior a hoy
  });
  
  const vencidosCompletados = itrbsVencidos.filter(item => item.estado === "Completado").length;
  const vencidosFaltantes = itrbsVencidos.filter(item => item.estado !== "Completado").length;
  const totalVencidos = vencidosCompletados + vencidosFaltantes;
  
  // Calculamos la diferencia entre completados y pendientes (para mostrar según configuración)
  const diferenciaVencidos = vencidosCompletados - vencidosFaltantes;
  
  // Datos para el gráfico de vencidos
  const vencidosData = [
    { name: 'Completados', value: vencidosCompletados, color: "#22c55e" },
    { name: 'Faltantes', value: vencidosFaltantes, color: "#ef4444" }
  ];
  
  // Colores para los gráficos
  const COLORS = ['#4F46E5', '#E5E7EB', '#F43F5E', '#D1D5DB'];
  const COLORS_VENCIDOS = ['#22c55e', '#ef4444'];
  
  // CustomTooltip para los gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Renderizar el dato de ITR B Vencidos según la configuración del usuario
  const renderDatoITRBVencidos = () => {
    switch (kpiConfig.itrVencidosMostrar) {
      case "total":
        return (
          <>
            <h3 className="text-2xl font-bold text-red-500">{totalVencidos}</h3>
            <span className="text-xs text-muted-foreground">en total</span>
          </>
        );
      case "diferencia":
        return (
          <>
            <h3 className={`text-2xl font-bold ${diferenciaVencidos >= 0 ? "text-green-500" : "text-red-500"}`}>
              {diferenciaVencidos >= 0 ? "+" : ""}{diferenciaVencidos}
            </h3>
            <span className="text-xs text-muted-foreground">diferencia</span>
          </>
        );
      case "pendientes":
        return (
          <>
            <h3 className="text-2xl font-bold text-red-500">{vencidosFaltantes}</h3>
            <span className="text-xs text-muted-foreground">pendientes</span>
          </>
        );
      case "completados":
        return (
          <>
            <h3 className="text-2xl font-bold text-green-500">{vencidosCompletados}</h3>
            <span className="text-xs text-muted-foreground">completados</span>
          </>
        );
      default:
        return (
          <>
            <h3 className="text-2xl font-bold text-red-500">{totalVencidos}</h3>
            <span className="text-xs text-muted-foreground">en total</span>
          </>
        );
    }
  };

  // Función para renderizar el valor KPI según la configuración
  const renderKPIValue = (type: "avanceFisico" | "totalITRB" | "realizadosITRB" | "actividadesVencidas" | "subsistemasMCC") => {
    switch (type) {
      case "avanceFisico":
        return (
          <h3 className="text-2xl font-bold">
            {typeof avancePorcentaje === 'number' ? avancePorcentaje.toFixed(1) : '0.0'}%
          </h3>
        );
      case "totalITRB":
        return <h3 className="text-2xl font-bold">{kpis.totalITRB}</h3>;
      case "realizadosITRB":
        return <h3 className="text-2xl font-bold">{kpis.realizadosITRB} / {kpis.totalITRB}</h3>;
      case "subsistemasMCC":
        return <h3 className="text-2xl font-bold">{kpis.subsistemasMCC} / {kpis.totalSubsistemas}</h3>;
      case "actividadesVencidas":
        return renderDatoITRBVencidos();
      default:
        return <h3 className="text-2xl font-bold">N/A</h3>;
    }
  };
  
  // Función para obtener el porcentaje para la barra de progreso basado en el tipo
  const getProgressValue = (type: "avanceFisico" | "totalITRB" | "realizadosITRB" | "actividadesVencidas" | "subsistemasMCC") => {
    switch (type) {
      case "avanceFisico":
        return avancePorcentaje;
      case "realizadosITRB":
        return (kpis.realizadosITRB / (kpis.totalITRB || 1)) * 100;
      case "subsistemasMCC":
        return (kpis.subsistemasMCC / (kpis.totalSubsistemas || 1)) * 100;
      default:
        return 0;
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1 */}
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {kpiConfig.nombreKPI1 || "Avance Físico"}
              </p>
              <div className="flex items-baseline">
                {renderKPIValue(kpiConfig.kpiPersonalizado1 || "avanceFisico")}
                {(kpiConfig.kpiPersonalizado1 === "avanceFisico" || !kpiConfig.kpiPersonalizado1) && (
                  <span className="text-xs text-green-500 ml-2 flex items-center">
                    <ArrowUpFromLine className="h-3 w-3 mr-1" />
                    Progreso
                  </span>
                )}
              </div>
              <Progress value={getProgressValue(kpiConfig.kpiPersonalizado1 || "avanceFisico")} className="h-2 mt-2" />
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiConfig.kpiPersonalizado1 === "subsistemasMCC" ? mccData : avanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {avanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI 2 */}
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1 text-indigo-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {kpiConfig.nombreKPI2 || "ITR B Completados"}
                </p>
              </div>
              <div className="flex items-baseline">
                {renderKPIValue(kpiConfig.kpiPersonalizado2 || "realizadosITRB")}
              </div>
              <Progress 
                value={getProgressValue(kpiConfig.kpiPersonalizado2 || "realizadosITRB")} 
                className="h-2 mt-2" 
              />
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiConfig.kpiPersonalizado2 === "subsistemasMCC" ? mccData : [
                      { name: 'Completados', value: kpis.realizadosITRB },
                      { name: 'Pendientes', value: kpis.totalITRB - kpis.realizadosITRB }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#4F46E5" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI 3 */}
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-indigo-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {kpiConfig.nombreKPI3 || "Subsistemas con MCC"}
                </p>
              </div>
              <div className="flex items-baseline">
                {renderKPIValue(kpiConfig.kpiPersonalizado3 || "subsistemasMCC")}
              </div>
              <Progress 
                value={getProgressValue(kpiConfig.kpiPersonalizado3 || "subsistemasMCC")} 
                className="h-2 mt-2" 
              />
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiConfig.kpiPersonalizado3 === "subsistemasMCC" || !kpiConfig.kpiPersonalizado3 ? mccData : [
                      { name: 'Completados', value: kpis.realizadosITRB },
                      { name: 'Pendientes', value: kpis.totalITRB - kpis.realizadosITRB }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mccData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI 4 - Vencidos */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {kpiConfig.nombreKPI4 || "ITR B Vencidos"}
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                {renderKPIValue(kpiConfig.kpiPersonalizado4 || "actividadesVencidas")}
              </div>
              <div className="text-xs mt-1 flex flex-col">
                <span className="text-green-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {vencidosCompletados} completados fuera de fecha
                </span>
                <span className="text-red-500 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {vencidosFaltantes} pendientes vencidos
                </span>
              </div>
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vencidosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {vencidosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;
