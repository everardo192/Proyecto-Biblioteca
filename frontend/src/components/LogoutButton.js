import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LogoutButton = ({ variant = 'primary', className = '', showIcon = true }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  const getButtonClass = () => {
    switch(variant) {
      case 'danger':
        return 'btn btn-danger';
      case 'outline-danger':
        return 'btn btn-outline-danger';
      case 'outline-primary':
        return 'btn btn-outline-primary';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <button 
      className={`${getButtonClass()} ${className}`}
      onClick={handleLogout}
    >
      {showIcon && <span className="me-2">🚪</span>}
      Cerrar Sesión
    </button>
  );
};

export default LogoutButton;