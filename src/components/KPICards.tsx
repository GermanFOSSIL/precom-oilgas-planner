
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, FileText, AlertTriangle, ArrowUpFromLine } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface KPICardsProps {
  proyectoId?: string;
}

const KPICards: React.FC<KPICardsProps> = ({ proyectoId }) => {
  const { getKPIs } = useAppContext();
  
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
  
  // Colores para los gráficos
  const COLORS = ['#4F46E5', '#E5E7EB', '#F43F5E', '#D1D5DB'];
  
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
      
      {/* Vencidos */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Vencidos</p>
              </div>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold text-red-500">{kpis.actividadesVencidas}</h3>
              </div>
              <div className="text-xs mt-1 text-muted-foreground">
                {kpis.actividadesVencidas === 0 ? (
                  <span className="text-green-500">No hay ITR B vencidos</span>
                ) : (
                  <span className="text-red-500">
                    {kpis.actividadesVencidas} {kpis.actividadesVencidas === 1 ? 'ITR B vencido' : 'ITR B vencidos'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-[70px] h-[70px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Vencidos', value: kpis.actividadesVencidas },
                      { name: 'Al día', value: kpis.totalITRB - kpis.actividadesVencidas }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#F43F5E" />
                    <Cell fill="#D1D5DB" />
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
