import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario',
    telefono: '',
    direccion: ''
  });
  
  const { isAdmin, user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios');
      setUsers([]);
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

  const validateForm = () => {
    const nombre = formData.nombre.trim();
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!nombre) {
      toast.error('El nombre es requerido');
      return false;
    }
    
    if (!email || !email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }
    
    if (!editingUser && (!password || password.length < 6)) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const userData = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null
      };
      
      if (isAdmin && editingUser) {
        userData.rol = formData.rol;
      }
      
      if (!editingUser) {
        userData.password = formData.password;
      }
      
      console.log('Enviando datos:', userData);
      
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await api.post('/users', userData);
        toast.success('Usuario creado exitosamente');
      }
      
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error detallado:', error);
      
      let errorMessage = 'Error al guardar usuario';
      
      if (error.response?.status === 403) {
        errorMessage = 'No tienes permiso para realizar esta acción';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        const details = error.response.data.details;
        if (Array.isArray(details)) {
          details.forEach(detail => {
            toast.error(`${detail.param}: ${detail.msg}`);
          });
          return;
        } else {
          errorMessage = details;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre || '',
      email: user.email || '',
      password: '',
      rol: user.rol || 'usuario',
      telefono: user.telefono || '',
      direccion: user.direccion || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('Usuario eliminado exitosamente');
        fetchUsers();
      } catch (error) {
        console.error('Error al eliminar:', error);
        const errorMessage = error.response?.data?.error || 'Error al eliminar usuario';
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'usuario',
      telefono: '',
      direccion: ''
    });
    setShowModal(false);
    setSubmitting(false);
  };

  const getRolBadge = (rol) => {
    switch(rol) {
      case 'administrador':
        return <span className="badge bg-danger">Administrador</span>;
      case 'bibliotecario':
        return <span className="badge bg-warning text-dark">Bibliotecario</span>;
      default:
        return <span className="badge bg-info">Usuario</span>;
    }
  };

  const isLastAdmin = () => {
    return editingUser?.id === currentUser?.id && 
           editingUser?.rol === 'administrador' && 
           users.filter(u => u.rol === 'administrador').length === 1;
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
        <h1>Gestión de Usuarios</h1>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <i className="bi bi-plus-circle"></i> Nuevo Usuario
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Teléfono</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    {user.nombre || 'N/A'}
                    {user.id === currentUser?.id && (
                      <span className="badge bg-secondary ms-2">Tú</span>
                    )}
                  </td>
                  <td>{user.email || 'N/A'}</td>
                  <td>{getRolBadge(user.rol)}</td>
                  <td>{user.telefono || '-'}</td>
                  <td>{user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : '-'}</td>
                  <td>
                    {isAdmin && (
                      <>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleEdit(user)}
                          disabled={user.id === currentUser?.id && user.rol === 'administrador' && users.filter(u => u.rol === 'administrador').length === 1}
                          title={user.id === currentUser?.id && user.rol === 'administrador' && users.filter(u => u.rol === 'administrador').length === 1 ? "No puedes editar al último administrador" : ""}
                        >
                          <i className="bi bi-pencil"></i> Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? "No puedes eliminarte a ti mismo" : ""}
                        >
                          <i className="bi bi-trash"></i> Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                  disabled={submitting}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  {!editingUser && (
                    <div className="mb-3">
                      <label className="form-label">Contraseña *</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength="6"
                        disabled={submitting}
                      />
                      <small className="text-muted">Mínimo 6 caracteres</small>
                    </div>
                  )}
                  
                  {isAdmin && editingUser && (
                    <div className="mb-3">
                      <label className="form-label">Rol</label>
                      <select
                        className="form-control"
                        name="rol"
                        value={formData.rol}
                        onChange={handleInputChange}
                        disabled={submitting || isLastAdmin()}
                      >
                        <option value="usuario">Usuario</option>
                        <option value="bibliotecario">Bibliotecario</option>
                        <option value="administrador">Administrador</option>
                      </select>
                      {isLastAdmin() && (
                        <small className="text-warning">No puedes cambiar el rol del último administrador</small>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={submitting}
                      placeholder="Opcional"
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
                      disabled={submitting}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Guardando...
                      </>
                    ) : (
                      editingUser ? 'Actualizar' : 'Guardar'
                    )}
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

export default Users;