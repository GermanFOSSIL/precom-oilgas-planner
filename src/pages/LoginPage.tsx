
import React from "react";
import { useAppContext } from "@/context/AppContext";
import Login from "@/components/Login";

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">FOSSIL Precom Track Plan</h1>
          <p className="text-muted-foreground italic">Del plan al arranque, en una sola plataforma.</p>
        </div>
        
        <Login />
        
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
          © {new Date().getFullYear()} Fossil Energy. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
