
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
  
  // Data para el gráfico de CCC
  const cccData = [
    { name: 'Con CCC', value: kpis.subsistemasCCC },
    { name: 'Sin CCC', value: kpis.totalSubsistemas - kpis.subsistemasCCC },
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
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Avance Físico */}
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Avance Físico</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">
                  {typeof avancePorcentaje === 'number' ? avancePorcentaje.toFixed(1) : '0.0'}%
                </h3>
                <span className="text-xs text-green-500 ml-2 flex items-center">
                  <ArrowUpFromLine className="h-3 w-3 mr-1" />
                  Progreso
                </span>
              </div>
              <Progress value={avancePorcentaje} className="h-2 mt-2" />
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={avanceData}
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
      
      {/* ITR B Completados */}
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1 text-indigo-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">ITR B Completados</p>
              </div>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">
                  {kpis.realizadosITRB} / {kpis.totalITRB}
                </h3>
              </div>
              <Progress 
                value={(kpis.realizadosITRB / (kpis.totalITRB || 1)) * 100} 
                className="h-2 mt-2" 
              />
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
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
      
      {/* Subsistemas con CCC */}
      <Card className="relative overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-indigo-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Subsistemas con CCC</p>
              </div>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold">
                  {kpis.subsistemasCCC} / {kpis.totalSubsistemas}
                </h3>
              </div>
              <Progress 
                value={(kpis.subsistemasCCC / (kpis.totalSubsistemas || 1)) * 100} 
                className="h-2 mt-2" 
              />
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cccData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {cccData.map((entry, index) => (
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
      
      {/* Vencidos - Modificado para mostrar completados vs faltantes fuera de fecha */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">ITR B Vencidos</p>
              </div>
              <div className="flex items-baseline gap-1">
                {renderDatoITRBVencidos()}
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
