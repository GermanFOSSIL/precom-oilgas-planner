
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

  // Adding a null onCancel since the Login component requires it but we don't need it on this page
  return (
    <div>
      <Login onSuccess={handleLoginSuccess} onCancel={null} />
    </div>
  );
};

export default LoginPage;
