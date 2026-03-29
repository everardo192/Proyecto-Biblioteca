import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/LogoutButton';
import api from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const profileRes = await api.get('/auth/profile');
      const userData = profileRes.data.user;
      
      setFormData({
        nombre: userData.nombre || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || ''
      });
      
      setLoans(profileRes.data.prestamos || []);
      
      try {
        const finesRes = await api.get(`/fines?usuario_id=${user?.id}`);
        setFines(finesRes.data || []);
      } catch (error) {
        console.log('No se pudieron cargar las multas:', error.message);
        setFines([]);
      }
      
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      toast.error('Error al cargar datos del perfil');
      setLoans([]);
      setFines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    setUpdating(true);
    
    try {
      const response = await api.put(`/users/${user.id}`, {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null
      });
      
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Perfil actualizado exitosamente');
      setEditing(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      const errorMessage = 
        error.response?.status === 403 
          ? 'No tienes permiso para actualizar este perfil'
          : error.response?.data?.error || error.response?.data?.details || 'Error al actualizar perfil. Por favor, intenta de nuevo.';
      
      toast.error(errorMessage);
      console.error('Error al actualizar perfil:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePayFine = async (fineId) => {
    try {
      await api.put(`/fines/${fineId}/pay`);
      toast.success('Multa pagada exitosamente');
      fetchProfileData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al pagar multa';
      toast.error(errorMessage);
      console.error('Error pagando multa:', error);
    }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mi Perfil</h1>
        <LogoutButton variant="outline-danger" />
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Información Personal</h4>
            </div>
            <div className="card-body">
              {!editing ? (
                <>
                  <p><strong>👤 Nombre:</strong> {user?.nombre || 'N/A'}</p>
                  <p><strong>📧 Email:</strong> {user?.email || 'N/A'}</p>
                  <p><strong>🎭 Rol:</strong> 
                    <span className={`badge ${user?.rol === 'administrador' ? 'bg-danger' : user?.rol === 'bibliotecario' ? 'bg-warning' : 'bg-info'} ms-2`}>
                      {user?.rol === 'administrador' ? 'Administrador' : user?.rol === 'bibliotecario' ? 'Bibliotecario' : 'Usuario'}
                    </span>
                  </p>
                  <p><strong>📞 Teléfono:</strong> {user?.telefono || 'No especificado'}</p>
                  <p><strong>📍 Dirección:</strong> {user?.direccion || 'No especificada'}</p>
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Editar Perfil
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      disabled={updating}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Ej: 123456789"
                      disabled={updating}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <textarea
                      className="form-control"
                      name="direccion"
                      rows="2"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      placeholder="Tu dirección completa"
                      disabled={updating}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-success flex-grow-1"
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        '💾 Guardar Cambios'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditing(false)}
                      disabled={updating}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {fines.length > 0 && (
            <div className="card mt-4">
              <div className="card-header bg-warning">
                <h4 className="mb-0">💰 Multas Pendientes</h4>
              </div>
              <div className="card-body">
                {fines.map(fine => (
                  <div key={fine.id} className="mb-3 p-2 border rounded">
                    <p><strong>📖 Libro:</strong> {fine.libro_titulo || 'N/A'}</p>
                    <p><strong>💰 Monto:</strong> ${parseFloat(fine.monto || 0).toFixed(2)}</p>
                    <p><strong>⏰ Días de retraso:</strong> {fine.dias_retraso || 0}</p>
                    {fine.estado === 'pendiente' && (
                      <button
                        className="btn btn-sm btn-success w-100"
                        onClick={() => handlePayFine(fine.id)}
                      >
                        Pagar Multa
                      </button>
                    )}
                  </div>
                ))}
                <p className="text-end fw-bold">
                  Total: ${fines.reduce((sum, fine) => sum + (parseFloat(fine.monto) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">📚 Historial de Préstamos</h4>
            </div>
            <div className="card-body">
              {loans.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Libro</th>
                        <th>Autor</th>
                        <th>Fecha Préstamo</th>
                        <th>Fecha Devolución</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map(loan => (
                        <tr key={loan.id}>
                          <td>{loan.libro_titulo || 'N/A'}</td>
                          <td>{loan.libro_autor || 'N/A'}</td>
                          <td>{loan.fecha_prestamo ? new Date(loan.fecha_prestamo).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            {loan.fecha_devolucion_real 
                              ? new Date(loan.fecha_devolucion_real).toLocaleDateString()
                              : loan.fecha_devolucion_estimada 
                              ? new Date(loan.fecha_devolucion_estimada).toLocaleDateString()
                              : 'N/A'
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
                <p className="text-muted text-center">No tienes préstamos registrados</p>
              )}
              <div className="text-center mt-3">
                <a href="/books" className="btn btn-primary btn-sm">
                  <i className="bi bi-search"></i> Buscar Libros
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;