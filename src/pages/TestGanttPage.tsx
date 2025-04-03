
import React, { useState, useEffect } from "react";
import GanttBarChart from "@/components/gantt/GanttBarChart";
import { generateSampleData, processDataForGantt } from "@/components/gantt/utils/sampleData";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TestGanttPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [sampleData, setSampleData] = useState<{
    actividades: any[];
    itrbItems: any[];
    proyectos: any[];
  }>({ actividades: [], itrbItems: [], proyectos: [] });
  
  const currentStartDate = new Date();
  const currentEndDate = addDays(new Date(), 30);
  
  // Load sample data on component mount
  useEffect(() => {
    const data = generateSampleData();
    setSampleData(data);
  }, []);
  
  // Process data for Gantt chart
  const ganttData = processDataForGantt(
    sampleData.actividades,
    sampleData.itrbItems,
    sampleData.proyectos,
    { proyecto: "todos" }
  );
  
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="p-4 border-b flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Test Gantt Chart</h1>
        <div className="ml-auto flex space-x-2">
          <Button 
            variant={viewMode === "month" ? "default" : "outline"}
            onClick={() => setViewMode("month")}
          >
            Mes
          </Button>
          <Button 
            variant={viewMode === "week" ? "default" : "outline"}
            onClick={() => setViewMode("week")}
          >
            Semana
          </Button>
          <Button 
            variant={viewMode === "day" ? "default" : "outline"}
            onClick={() => setViewMode("day")}
          >
            Día
          </Button>
        </div>
      </div>
      
      {/* Main content with full height and scroll */}
      <div className="flex-1 w-full overflow-y-auto">
        {ganttData.length > 0 ? (
          <GanttBarChart
            data={ganttData}
            currentStartDate={currentStartDate}
            currentEndDate={currentEndDate}
            zoomLevel={1}
            viewMode={viewMode}
            mostrarSubsistemas={true}
            mostrarLeyenda={true}
            tamanoGrafico="mediano"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-gray-500">Cargando datos de muestra...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestGanttPage;
