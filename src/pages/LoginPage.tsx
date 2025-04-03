
import React, { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import Login from "@/components/Login";

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

  return <Login onSuccess={handleLoginSuccess} />;
};

export default LoginPage;
