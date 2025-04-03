
import React from "react";

const GanttEmptyState: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">No hay actividades para mostrar</h3>
        <p className="text-muted-foreground">
          Ajusta los filtros o agrega nuevas actividades
        </p>
      </div>
    </div>
  );
};

export default GanttEmptyState;
