
import React, { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import Login from "@/components/Login";
import PublicHeader from "@/components/PublicHeader";

const LoginPage: React.FC = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  
  // Si el usuario ya está logueado, redirigir a home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLoginSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <PublicHeader onLoginClick={null} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Login onSuccess={handleLoginSuccess} onCancel={null} />
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Plan de Precomisionado | © {new Date().getFullYear()} Fossil Energy
      </footer>
    </div>
  );
};

export default LoginPage;
