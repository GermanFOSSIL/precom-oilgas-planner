
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Circle, FileCheck } from "lucide-react";

const KPICards: React.FC = () => {
  const { getKPIs } = useAppContext();
  const kpis = getKPIs();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <FileCheck className="mr-1 h-4 w-4 text-estado-completado" />
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
            <CheckCircle className="mr-1 h-4 w-4 text-oilgas-accent" />
            Subsistemas con CCC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.subsistemasCCC}
          </div>
        </CardContent>
      </Card>

      {/* Actividades vencidas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <AlertCircle className="mr-1 h-4 w-4 text-estado-vencido" />
            Vencidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-estado-vencido">
            {kpis.actividadesVencidas}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;
