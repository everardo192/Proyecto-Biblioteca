import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isLibrarian } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/dashboard">
          <i className="bi bi-building-fill fs-5"></i> Biblioteca
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-1" to="/dashboard">
                <i className="bi bi-speedometer2"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-1" to="/books">
                <i className="bi bi-book"></i> Libros
              </Link>
            </li>
            {(isAdmin || isLibrarian) && (
              <>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center gap-1" to="/users">
                    <i className="bi bi-people"></i> Usuarios
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center gap-1" to="/loans">
                    <i className="bi bi-arrow-left-right"></i> Préstamos
                  </Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-white text-decoration-none d-flex align-items-center gap-1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle"></i> {user?.nombre}
                {user?.rol && (
                  <span className={`badge ${user.rol === 'administrador' ? 'bg-danger' : user.rol === 'bibliotecario' ? 'bg-warning' : 'bg-info'}`}>
                    {user.rol === 'administrador' ? 'Admin' : user.rol === 'bibliotecario' ? 'Bibliotecario' : 'Usuario'}
                  </span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2" to="/profile">
                    <i className="bi bi-person-lines-fill"></i> Mi Perfil
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger d-flex align-items-center gap-2"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;