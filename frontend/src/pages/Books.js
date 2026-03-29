import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [filters, setFilters] = useState({
    titulo: '',
    autor: '',
    categoria_id: ''
  });
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    isbn: '',
    editorial: '',
    anio_publicacion: '',
    categoria_id: '',
    cantidad_total: 1,
    ubicacion: '',
    descripcion: ''
  });

  const { isAdmin, isLibrarian } = useAuth();

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [filters]);

  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.titulo) params.append('titulo', filters.titulo);
      if (filters.autor) params.append('autor', filters.autor);
      if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);

      const response = await api.get(`/books?${params.toString()}`);
      setBooks(response.data);
    } catch (error) {
      toast.error('Error al cargar libros');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!formData.autor.trim()) {
      toast.error('El autor es requerido');
      return;
    }

    if (formData.cantidad_total < 1) {
      toast.error('La cantidad debe ser al menos 1');
      return;
    }

    setLoading(true);

    try {
      if (editingBook) {
        await api.put(`/books/${editingBook.id}`, formData);
        toast.success('Libro actualizado exitosamente');
      } else {
        await api.post('/books', formData);
        toast.success('Libro creado exitosamente');
      }
      resetForm();
      fetchBooks();
    } catch (error) {
      console.error('Error detallado:', error);

      if (error.response?.data?.details) {
        if (Array.isArray(error.response.data.details)) {
          error.response.data.details.forEach(detail => {
            toast.error(`${detail.campo || detail.param}: ${detail.mensaje || detail.msg}`);
          });
        } else {
          toast.error(error.response.data.details);
        }
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al guardar libro');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      titulo: book.titulo,
      autor: book.autor,
      isbn: book.isbn || '',
      editorial: book.editorial || '',
      anio_publicacion: book.anio_publicacion || '',
      categoria_id: book.categoria_id || '',
      cantidad_total: book.cantidad_total,
      ubicacion: book.ubicacion || '',
      descripcion: book.descripcion || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este libro?')) {
      try {
        await api.delete(`/books/${id}`);
        toast.success('Libro eliminado exitosamente');
        fetchBooks();
      } catch (error) {
        toast.error('Error al eliminar libro');
      }
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setFormData({
      titulo: '',
      autor: '',
      isbn: '',
      editorial: '',
      anio_publicacion: '',
      categoria_id: '',
      cantidad_total: 1,
      ubicacion: '',
      descripcion: ''
    });
    setShowModal(false);
  };

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Libros</h1>
        {(isAdmin || isLibrarian) && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Nuevo Libro
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por título"
                name="titulo"
                value={filters.titulo}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por autor"
                name="autor"
                value={filters.autor}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-control"
                name="categoria_id"
                value={filters.categoria_id}
                onChange={handleFilterChange}
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de libros */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>ISBN</th>
              <th>Categoría</th>
              <th>Disponibles</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id}>
                <td>{book.titulo}</td>
                <td>{book.autor}</td>
                <td>{book.isbn}</td>
                <td>{book.categoria_nombre}</td>
                <td>
                  <span className={`badge ${book.cantidad_disponible > 0 ? 'bg-success' : 'bg-danger'}`}>
                    {book.cantidad_disponible}
                  </span>
                </td>
                <td>{book.cantidad_total}</td>
                <td>
                  {(isAdmin || isLibrarian) && (
                    <>
                      <button
                        className="btn btn-sm btn-info me-2"
                        onClick={() => handleEdit(book)}
                      >
                        Editar
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(book.id)}
                        >
                          Eliminar
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

      {/* Modal de libro */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingBook ? 'Editar Libro' : 'Nuevo Libro'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Título *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Autor *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="autor"
                        value={formData.autor}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ISBN</label>
                      <input
                        type="text"
                        className="form-control"
                        name="isbn"
                        value={formData.isbn}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Editorial</label>
                      <input
                        type="text"
                        className="form-control"
                        name="editorial"
                        value={formData.editorial}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Año de Publicación</label>
                      <input
                        type="number"
                        className="form-control"
                        name="anio_publicacion"
                        value={formData.anio_publicacion}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-control"
                        name="categoria_id"
                        value={formData.categoria_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Cantidad Total *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="cantidad_total"
                        value={formData.cantidad_total}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Ubicación</label>
                      <input
                        type="text"
                        className="form-control"
                        name="ubicacion"
                        value={formData.ubicacion}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        name="descripcion"
                        rows="3"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                      />
                    </div>
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
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : editingBook ? 'Actualizar' : 'Guardar'}
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

export default Books;