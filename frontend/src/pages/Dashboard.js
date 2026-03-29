import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLibros: 0,
    prestamosActivos: 0,
    misPrestamos: 0,
    usuariosActivos: 0,
    multasPendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [mostLoanedBooks, setMostLoanedBooks] = useState([]);
  const [myLoans, setMyLoans] = useState([]);

  const isAdmin = user?.rol === 'administrador';
  const isLibrarian = user?.rol === 'bibliotecario';
  const isAdminOrLibrarian = isAdmin || isLibrarian;

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Obtener total de libros (disponible para todos los roles)
      const librosRes = await api.get('/books');
      setStats(prev => ({ ...prev, totalLibros: librosRes.data.length }));

      // 2. Obtener préstamos del usuario actual con fallback
      await fetchMyLoans();

      // 3. Datos adicionales para admin y bibliotecario
      if (isAdminOrLibrarian) {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error general al cargar dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLoans = async () => {
    try {
      // Intento principal: filtrar por usuario_id en query param
      const myLoansRes = await api.get(`/loans?usuario_id=${user.id}`);
      const activeLoans = myLoansRes.data.filter(loan => loan.estado === 'activo');
      setStats(prev => ({ ...prev, misPrestamos: activeLoans.length }));
      setMyLoans(myLoansRes.data.slice(0, 5));
    } catch (primaryError) {
      console.warn('Filtro por query param falló, intentando fallback:', primaryError);
      try {
        // Fallback: obtener todos y filtrar en cliente
        const allLoansRes = await api.get('/loans');
        const userLoans = allLoansRes.data.filter(loan => loan.usuario_id === user.id);
        const activeLoans = userLoans.filter(loan => loan.estado === 'activo');
        setStats(prev => ({ ...prev, misPrestamos: activeLoans.length }));
        setMyLoans(userLoans.slice(0, 5));
      } catch (fallbackError) {
        console.error('Fallback también falló:', fallbackError);
        toast.warn('No se pudieron cargar tus préstamos');
      }
    }
  };

  const fetchAdminData = async () => {
    // Estadísticas administrativas
    try {
      const [prestamosRes, usuariosRes, multasRes] = await Promise.all([
        api.get('/loans?estado=activo'),
        api.get('/users'),
        api.get('/fines?estado=pendiente')
      ]);

      setStats(prev => ({
        ...prev,
        prestamosActivos: prestamosRes.data.length,
        usuariosActivos: usuariosRes.data.length,
        multasPendientes: multasRes.data.length
      }));
    } catch (error) {
      console.error('Error al cargar estadísticas administrativas:', error);
      toast.warn('No se pudieron cargar algunas estadísticas administrativas');
    }

    // Libros más prestados (fallo independiente)
    try {
      const mostLoanedRes = await api.get('/books/most-loaned?limit=5');
      setMostLoanedBooks(mostLoanedRes.data);
    } catch (error) {
      console.error('Error al cargar libros más prestados:', error);
      // No se muestra toast para no saturar; la UI mostrará el estado vacío
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1><i className="bi bi-speedometer2 me-2 text-primary"></i>Dashboard</h1>
          <h5 className="text-muted">
            <i className="bi bi-hand-wave me-1"></i>Bienvenido, {user?.nombre}!
            {user?.rol && (
              <span className={`badge ms-2 ${isAdmin ? 'bg-danger' : isLibrarian ? 'bg-warning' : 'bg-info'}`}>
                {isAdmin ? 'Administrador' : isLibrarian ? 'Bibliotecario' : 'Usuario'}
              </span>
            )}
          </h5>
        </div>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i>Cerrar Sesión
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title">Total Libros</h5>
                <h2 className="card-text">{stats.totalLibros}</h2>
              </div>
              <i className="bi bi-book fs-1 opacity-75"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title">Mis Préstamos Activos</h5>
                <h2 className="card-text">{stats.misPrestamos}</h2>
              </div>
              <i className="bi bi-journal-bookmark-fill fs-1 opacity-75"></i>
            </div>
          </div>
        </div>

        {isAdminOrLibrarian && (
          <>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Préstamos Activos</h5>
                    <h2 className="card-text">{stats.prestamosActivos}</h2>
                  </div>
                  <i className="bi bi-arrow-left-right fs-1 opacity-75"></i>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-white">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Multas Pendientes</h5>
                    <h2 className="card-text">{stats.multasPendientes}</h2>
                  </div>
                  <i className="bi bi-exclamation-triangle fs-1 opacity-75"></i>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sección de tablas */}
      <div className="row mt-4">
        {isAdminOrLibrarian && (
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-bar-chart-line me-2"></i>Libros Más Prestados
                </h5>
              </div>
              <div className="card-body">
                {mostLoanedBooks.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {mostLoanedBooks.map((book, index) => (
                      <li key={book.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-bookmark-fill text-info me-2"></i>
                          <strong>{index + 1}. {book.titulo}</strong>
                          <br />
                          <small className="text-muted ms-4">
                            <i className="bi bi-person me-1"></i>{book.autor}
                          </small>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          <i className="bi bi-arrow-repeat me-1"></i>{book.prestamos_count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-center">
                    <i className="bi bi-inbox me-2"></i>No hay datos disponibles
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={isAdminOrLibrarian ? 'col-md-6' : 'col-md-12'}>
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>Mis Préstamos Recientes
              </h5>
            </div>
            <div className="card-body">
              {myLoans.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Libro</th>
                        <th>Fecha Préstamo</th>
                        <th>Devolución</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLoans.map(loan => (
                        <tr key={loan.id}>
                          <td>{loan.libro_titulo}</td>
                          <td>{new Date(loan.fecha_prestamo).toLocaleDateString()}</td>
                          <td>
                            {loan.fecha_devolucion_real
                              ? new Date(loan.fecha_devolucion_real).toLocaleDateString()
                              : new Date(loan.fecha_devolucion_estimada).toLocaleDateString()
                            }
                          </td>
                          <td>
                            <span className={`badge ${loan.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                              {loan.estado === 'activo' ? 'Activo' : 'Devuelto'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center">
                  <i className="bi bi-inbox me-2"></i>No tienes préstamos registrados
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <i className="bi bi-lightning-charge me-2"></i>Acciones Rápidas
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-2">
                  <a href="/books" className="btn btn-outline-primary w-100">
                    <i className="bi bi-search me-2"></i>Buscar Libros
                  </a>
                </div>
                {isAdminOrLibrarian && (
                  <>
                    <div className="col-md-3 mb-2">
                      <a href="/loans" className="btn btn-outline-success w-100">
                        <i className="bi bi-plus-circle me-2"></i>Registrar Préstamo
                      </a>
                    </div>
                    <div className="col-md-3 mb-2">
                      <a href="/users" className="btn btn-outline-info w-100">
                        <i className="bi bi-people me-2"></i>Gestionar Usuarios
                      </a>
                    </div>
                  </>
                )}
                <div className="col-md-3 mb-2">
                  <a href="/profile" className="btn btn-outline-secondary w-100">
                    <i className="bi bi-person-circle me-2"></i>Mi Perfil
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;