
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, FileCheck, Layers } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

interface KPICardsProps {
  proyectoId?: string;
}

const COLORS = ["#22c55e", "#94a3b8"];
const COLORS_RED = ["#ef4444", "#94a3b8"];
const COLORS_INDIGO = ["#6366f1", "#94a3b8"];

const KPICards: React.FC<KPICardsProps> = ({ proyectoId }) => {
  const { getKPIs, proyectos } = useAppContext();
  const kpis = getKPIs(proyectoId);

  // Si hay un proyecto seleccionado, mostrar su título
  const proyectoTitulo = proyectoId && proyectoId !== "todos" ? 
    proyectos.find(p => p.id === proyectoId)?.titulo || "Proyecto" : 
    "Todos los proyectos";

  // Datos para los gráficos de pie
  const dataITRB = [
    { name: "Completados", value: kpis.realizadosITRB },
    { name: "Pendientes", value: kpis.totalITRB - kpis.realizadosITRB }
  ];

  const dataSubsistemas = [
    { name: "Con CCC", value: kpis.subsistemasCCC },
    { name: "Sin CCC", value: kpis.totalSubsistemas - kpis.subsistemasCCC }
  ];

  const dataVencidos = [
    { name: "Vencidos", value: kpis.actividadesVencidas },
    { name: "En Tiempo", value: kpis.totalITRB - kpis.actividadesVencidas }
  ];

  return (
    <div className="mb-6">
      {proyectoId && proyectoId !== "todos" && (
        <h2 className="text-lg font-semibold mb-2 text-muted-foreground">
          {proyectoTitulo}
        </h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avance físico */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avance Físico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {kpis.avanceFisico.toFixed(1)}%
            </div>
            <Progress
              value={kpis.avanceFisico}
              className="h-2 mb-2"
            />
            <div className="h-[100px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completado", value: kpis.avanceFisico },
                      { name: "Pendiente", value: 100 - kpis.avanceFisico }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border rounded shadow text-xs">
                            {payload[0].name}: {payload[0].value.toFixed(1)}%
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ITR B completados */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <FileCheck className="mr-1 h-4 w-4 text-green-500" />
              ITR B Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {kpis.realizadosITRB} / {kpis.totalITRB}
            </div>
            <Progress
              value={kpis.totalITRB > 0 ? (kpis.realizadosITRB / kpis.totalITRB) * 100 : 0}
              className="h-2 mb-2"
            />
            
            <ChartContainer 
              config={{
                Completados: { color: "#22c55e" },
                Pendientes: { color: "#94a3b8" }
              }}
              className="h-[100px] mt-4"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataITRB}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {dataITRB.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => 
                      active && payload && payload.length ? (
                        <ChartTooltipContent
                          className="bg-white p-2 border rounded shadow text-xs"
                        />
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subsistemas con CCC */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="mr-1 h-4 w-4 text-indigo-500" />
              Subsistemas con CCC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {kpis.subsistemasCCC} / {kpis.totalSubsistemas}
            </div>
            <Progress
              value={kpis.totalSubsistemas > 0 ? (kpis.subsistemasCCC / kpis.totalSubsistemas) * 100 : 0}
              className="h-2 mb-2"
            />
            
            <ChartContainer 
              config={{
                "Con CCC": { color: "#6366f1" },
                "Sin CCC": { color: "#94a3b8" }
              }}
              className="h-[100px] mt-4"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataSubsistemas}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {dataSubsistemas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_INDIGO[index % COLORS_INDIGO.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => 
                      active && payload && payload.length ? (
                        <ChartTooltipContent
                          className="bg-white p-2 border rounded shadow text-xs"
                        />
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Actividades vencidas */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 mb-2">
              {kpis.actividadesVencidas}
            </div>
            
            <ChartContainer 
              config={{
                Vencidos: { color: "#ef4444" },
                "En Tiempo": { color: "#94a3b8" }
              }}
              className="h-[100px] mt-4"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataVencidos}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {dataVencidos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_RED[index % COLORS_RED.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => 
                      active && payload && payload.length ? (
                        <ChartTooltipContent
                          className="bg-white p-2 border rounded shadow text-xs"
                        />
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <div className="text-xs text-muted-foreground mt-2">
              {kpis.actividadesVencidas > 0 
                ? `${kpis.actividadesVencidas} ITR B requieren atención inmediata` 
                : "No hay ITR B vencidos"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KPICards;
