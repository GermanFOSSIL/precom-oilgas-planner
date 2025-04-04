
import React from "react";
import Header from "@/components/Header";
import ITRBackupManagerStandalone from "@/components/ITRBackupManagerStandalone";
import { useAppContext } from "@/context/AppContext";
import { Toaster } from "sonner";
import { Navigate } from "react-router-dom";

const ITRManagement: React.FC = () => {
  const { user, isAdmin, isTecnico } = useAppContext();

  // Redirect if user doesn't have access
  if (!user || (!isAdmin && !isTecnico)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Toaster />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          <ITRBackupManagerStandalone />
        </div>
      </main>
    </div>
  );
};

export default ITRManagement;
