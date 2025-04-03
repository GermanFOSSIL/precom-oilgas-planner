
import React, { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import Login from "@/components/Login";
import PublicHeader from "@/components/PublicHeader";

const LoginPage: React.FC = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLoginSuccess = () => {
    navigate("/");
  };

  // Creating a proper full-page login experience
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <PublicHeader onLoginClick={null} />
      <div className="flex-1 flex items-center justify-center">
        <Login onSuccess={handleLoginSuccess} onCancel={null} />
      </div>
    </div>
  );
};

export default LoginPage;
