
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import KPICards from "@/components/KPICards";
import { ConfiguracionGrafico, FiltrosDashboard } from "@/types";
import PublicHeader from "@/components/PublicHeader";
import { useExportUtils } from "@/components/dashboard/ExportUtils";
import HeaderControls from "@/components/dashboard/HeaderControls";
import FilterControls from "@/components/dashboard/FilterControls";
import { toast } from "sonner";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import DashboardFooter from "@/components/dashboard/DashboardFooter";

const Dashboard: React.FC = () => {
  const {
    filtros,
    setFiltros,
    theme,
    toggleTheme,
    logout,
    getKPIs,
    user
  } = useAppContext();

  const defaultConfiguracionGrafico: ConfiguracionGrafico = {
    tamano: "mediano",
    mostrarLeyenda: true,
    mostrarSubsistemas: true
  };

  const [configuracionGrafico, setConfiguracionGrafico] = useState<ConfiguracionGrafico>(defaultConfiguracionGrafico);
  const [tabActual, setTabActual] = useState("alertas");
  const [exportingChart, setExportingChart] = useState(false);
  const [mostrarSubsistemas, setMostrarSubsistemas] = useState(true);
  
  // Determinamos si el usuario tiene roles específicos
  const isAdmin = user && user.role === "admin";
  const isTecnico = user && user.role === "tecnico";

  const ensureStringTimestamp = useCallback((timestamp: number | string | undefined): string => {
    if (timestamp === undefined) return String(Date.now());
    return typeof timestamp === 'number' ? String(timestamp) : timestamp;
  }, []);

  const safeUpdateFilters = useCallback(() => {
    const currentTimestamp = ensureStringTimestamp(Date.now());
    setFiltros({
      ...filtros,
      timestamp: currentTimestamp
    });
  }, [ensureStringTimestamp, setFiltros, filtros]);

  useEffect(() => {
    safeUpdateFilters();
    const interval = setInterval(safeUpdateFilters, 60000);
    return () => clearInterval(interval);
  }, [safeUpdateFilters]);

  const handleFiltroChange = useCallback((key: keyof FiltrosDashboard, value: any) => {
    if (key === 'timestamp') {
      setFiltros({
        ...filtros,
        [key]: ensureStringTimestamp(value)
      });
    } else {
      setFiltros({
        ...filtros,
        [key]: value
      });
    }
  }, [ensureStringTimestamp, setFiltros, filtros]);

  const handleResetFilters = useCallback(() => {
    setFiltros({
      proyecto: "todos",
      timestamp: ensureStringTimestamp(Date.now())
    });
    toast.success("Filtros restablecidos");
  }, [setFiltros, ensureStringTimestamp]);

  const handleResetSession = useCallback(() => {
    logout();
    window.location.reload();
  }, [logout]);

  const handleSubsistemaToggle = useCallback((checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      setMostrarSubsistemas(checked);
      setConfiguracionGrafico(prev => ({
        ...prev,
        mostrarSubsistemas: checked
      }));
    }
  }, []);

  // Function to transform getKPIs output into an array format for export
  const getKPIsForExport = useCallback((proyectoId?: string): any[] => {
    const kpiData = getKPIs(proyectoId);
    return [
      {
        titulo: "Avance Físico",
        valor: `${kpiData.avanceFisico.toFixed(1)}%`,
        descripcion: "Porcentaje de avance del proyecto"
      },
      {
        titulo: "ITRs Totales",
        valor: kpiData.totalITRB,
        descripcion: "Cantidad total de ITRs"
      },
      {
        titulo: "ITRs Realizados",
        valor: kpiData.realizadosITRB,
        descripcion: "Cantidad de ITRs realizados"
      },
      {
        titulo: "Subsistemas con MCC",
        valor: `${kpiData.subsistemasMCC} de ${kpiData.totalSubsistemas}`,
        descripcion: "Subsistemas que contienen MCC"
      },
      {
        titulo: "Actividades Vencidas",
        valor: kpiData.actividadesVencidas,
        descripcion: "Cantidad de actividades vencidas"
      }
    ];
  }, [getKPIs]);

  const { generarPDF, generarExcel } = useExportUtils({
    proyectos: [],
    actividades: [],
    itrbItems: [],
    getKPIs: getKPIsForExport
  });

  const handleExportPDF = useCallback(async () => {
    setExportingChart(true);
    try {
      await generarPDF(filtros);
      toast.success("Documento PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el documento PDF");
    } finally {
      setExportingChart(false);
    }
  }, [filtros, generarPDF]);

  const handleExportExcel = useCallback(async () => {
    setExportingChart(true);
    try {
      await generarExcel(filtros);
      toast.success("Documento Excel generado correctamente");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast.error("Error al generar el documento Excel");
    } finally {
      setExportingChart(false);
    }
  }, [filtros, generarExcel]);

  // Determine if we should show the header controls or simplified view
  const showHeaderControls = isAdmin || isTecnico;

  return (
    <div className={`min-h-screen flex flex-col ${theme.mode === "dark" ? "dark bg-slate-900 text-white" : "bg-gray-50"}`}>
      <PublicHeader />

      <main className="flex-1 container mx-auto px-4 py-6">
        {showHeaderControls ? (
          <HeaderControls 
            onResetSession={handleResetSession}
            onToggleTheme={toggleTheme}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            exportingChart={exportingChart}
          />
        ) : (
          <div className="flex justify-between mb-4 flex-wrap gap-2">
            <FilterControls 
              filtros={filtros}
              onFiltroChange={handleFiltroChange}
              onSubsistemaToggle={handleSubsistemaToggle}
              mostrarSubsistemas={mostrarSubsistemas}
              onClearAllFilters={handleResetFilters}
            />
          </div>
        )}

        <KPICards proyectoId={filtros.proyecto !== "todos" ? filtros.proyecto : undefined} />

        <DashboardTabs
          tabActual={tabActual}
          setTabActual={setTabActual}
          filtros={filtros}
          configuracionGrafico={configuracionGrafico}
          mostrarSubsistemas={mostrarSubsistemas}
          exportingChart={exportingChart}
          handleExportPDF={handleExportPDF}
          showHeaderControls={showHeaderControls}
        />
        
        <DashboardFooter />
      </main>
    </div>
  );
};

export default Dashboard;
