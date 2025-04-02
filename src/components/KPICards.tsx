
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, FileCheck, Layers } from "lucide-react";

interface KPICardsProps {
  proyectoId?: string;
}

const KPICards: React.FC<KPICardsProps> = ({ proyectoId }) => {
  const { getKPIs, proyectos } = useAppContext();
  const kpis = getKPIs(proyectoId);

  // Si hay un proyecto seleccionado, mostrar su título
  const proyectoTitulo = proyectoId && proyectoId !== "todos" ? 
    proyectos.find(p => p.id === proyectoId)?.titulo || "Proyecto" : 
    "Todos los proyectos";

  return (
    <div className="mb-6">
      {proyectoId && proyectoId !== "todos" && (
        <h2 className="text-lg font-semibold mb-2 text-muted-foreground">
          {proyectoTitulo}
        </h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avance físico */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avance Físico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.avanceFisico.toFixed(1)}%
            </div>
            <Progress
              value={kpis.avanceFisico}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        {/* ITR B completados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <FileCheck className="mr-1 h-4 w-4 text-green-500" />
              ITR B Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.realizadosITRB} / {kpis.totalITRB}
            </div>
            <Progress
              value={kpis.totalITRB > 0 ? (kpis.realizadosITRB / kpis.totalITRB) * 100 : 0}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        {/* Subsistemas con CCC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="mr-1 h-4 w-4 text-indigo-500" />
              Subsistemas con CCC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.subsistemasCCC} / {kpis.totalSubsistemas}
            </div>
            <Progress
              value={kpis.totalSubsistemas > 0 ? (kpis.subsistemasCCC / kpis.totalSubsistemas) * 100 : 0}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        {/* Actividades vencidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {kpis.actividadesVencidas}
            </div>
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
