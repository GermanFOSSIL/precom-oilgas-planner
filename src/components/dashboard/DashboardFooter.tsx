
import React from "react";

const DashboardFooter: React.FC = () => {
  return (
    <div className="py-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700 mt-6">
      <div className="mb-2 text-sm italic text-gray-600 dark:text-gray-400">
        Del plan al arranque, en una sola plataforma.
      </div>
      Plan de Precomisionado | v1.0.0 | © {new Date().getFullYear()} Fossil Energy
    </div>
  );
};

export default DashboardFooter;
