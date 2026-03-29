const Book = require('../models/Book');
const { validationResult } = require('express-validator');

exports.getBooks = async (req, res) => {
  try {
    const { titulo, autor, categoria_id } = req.query;
    const filters = {};
    
    if (titulo) filters.titulo = titulo;
    if (autor) filters.autor = autor;
    if (categoria_id) filters.categoria_id = categoria_id;
    
    const books = await Book.findAll(filters);
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener libros' });
  }
};

exports.getBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener libro' });
  }
};

exports.createBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Devolver detalles específicos de los errores de validación
      return res.status(400).json({ 
        error: 'Error de validación',
        details: errors.array().map(err => ({
          campo: err.param,
          mensaje: err.msg
        }))
      });
    }

    // Validar que los campos requeridos estén presentes
    const { titulo, autor, cantidad_total } = req.body;
    if (!titulo || !autor) {
      return res.status(400).json({ 
        error: 'Campos requeridos faltantes',
        details: 'Título y autor son obligatorios'
      });
    }

    if (!cantidad_total || cantidad_total < 1) {
      return res.status(400).json({ 
        error: 'Cantidad inválida',
        details: 'La cantidad total debe ser al menos 1'
      });
    }

    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    console.error('Error detallado:', error);
    // Manejar errores específicos de la base de datos
    if (error.code === '23505') { // Violación de unicidad (ISBN duplicado)
      return res.status(400).json({ 
        error: 'ISBN duplicado',
        details: 'Ya existe un libro con este ISBN'
      });
    }
    res.status(500).json({ 
      error: 'Error al crear libro',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Error de validación',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const book = await Book.update(id, req.body);
    
    if (!book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.json(book);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'ISBN duplicado' });
    }
    res.status(500).json({ error: 'Error al actualizar libro' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.delete(id);
    
    if (!book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.json({ message: 'Libro eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar libro' });
  }
};

exports.getMostLoanedBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await Book.getMostLoaned(limit);
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener libros más prestados' });
  }
};