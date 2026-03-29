import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id: '',
    libro_id: '',
    dias_prestamo: 7
  });
  
  const { isAdmin, isLibrarian } = useAuth();

  useEffect(() => {
    fetchLoans();
    fetchUsers();
    fetchBooks();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans');
      setLoans(response.data);
    } catch (error) {
      toast.error('Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data.filter(book => book.cantidad_disponible > 0));
    } catch (error) {
      console.error('Error al cargar libros:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', formData);
      toast.success('Préstamo registrado exitosamente');
      resetForm();
      fetchLoans();
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar préstamo');
    }
  };

  const handleReturn = async (loanId) => {
    if (window.confirm('¿Registrar devolución de este préstamo?')) {
      try {
        await api.put(`/loans/${loanId}/return`);
        toast.success('Devolución registrada exitosamente');
        fetchLoans();
        fetchBooks();
      } catch (error) {
        toast.error('Error al registrar devolución');
      }
    }
  };

  const handleRenew = async (loanId) => {
    try {
      await api.put(`/loans/${loanId}/renew`);
      toast.success('Préstamo renovado exitosamente');
      fetchLoans();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al renovar préstamo');
    }
  };

  const resetForm = () => {
    setFormData({
      usuario_id: '',
      libro_id: '',
      dias_prestamo: 7
    });
    setShowModal(false);
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'activo':
        return <span className="badge bg-success">Activo</span>;
      case 'devuelto':
        return <span className="badge bg-secondary">Devuelto</span>;
      default:
        return <span className="badge bg-info">{estado}</span>;
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Préstamos</h1>
        {(isAdmin || isLibrarian) && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Nuevo Préstamo
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Libro</th>
              <th>Fecha Préstamo</th>
              <th>Fecha Devolución Estimada</th>
              <th>Fecha Devolución Real</th>
              <th>Estado</th>
              <th>Renovaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>{loan.usuario_nombre}</td>
                <td>{loan.libro_titulo}</td>
                <td>{new Date(loan.fecha_prestamo).toLocaleDateString()}</td>
                <td className={new Date(loan.fecha_devolucion_estimada) < new Date() && loan.estado === 'activo' ? 'text-danger fw-bold' : ''}>
                  {new Date(loan.fecha_devolucion_estimada).toLocaleDateString()}
                </td>
                <td>{loan.fecha_devolucion_real ? new Date(loan.fecha_devolucion_real).toLocaleDateString() : '-'}</td>
                <td>{getEstadoBadge(loan.estado)}</td>
                <td>{loan.renovaciones}/2</td>
                <td>
                  {loan.estado === 'activo' && (
                    <>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleReturn(loan.id)}
                      >
                        Devolver
                      </button>
                      {loan.renovaciones < 2 && (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleRenew(loan.id)}
                        >
                          Renovar
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de préstamo */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Préstamo</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Usuario *</label>
                    <select
                      className="form-control"
                      name="usuario_id"
                      value={formData.usuario_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar usuario</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.nombre} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Libro *</label>
                    <select
                      className="form-control"
                      name="libro_id"
                      value={formData.libro_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar libro</option>
                      {books.map(book => (
                        <option key={book.id} value={book.id}>
                          {book.titulo} - {book.autor} (Disponibles: {book.cantidad_disponible})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Días de Préstamo</label>
                    <input
                      type="number"
                      className="form-control"
                      name="dias_prestamo"
                      value={formData.dias_prestamo}
                      onChange={handleInputChange}
                      min="1"
                      max="30"
                      required
                    />
                    <small className="text-muted">Máximo 30 días</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Registrar Préstamo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;