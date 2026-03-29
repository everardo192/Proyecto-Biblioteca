const Loan = require('../models/Loan');
const Book = require('../models/Book');
const { validationResult } = require('express-validator');

/**
 * Obtener préstamos con filtros
 * - Usuarios normales: solo ven sus propios préstamos
 * - Admin/Bibliotecario: pueden ver todos o filtrar por usuario
 */
exports.getLoans = async (req, res) => {
  try {
    const { usuario_id, estado } = req.query;
    const filters = {};
    
    // Control de permisos: usuarios normales solo ven sus propios préstamos
    if (req.user.rol !== 'administrador' && req.user.rol !== 'bibliotecario') {
      filters.usuario_id = req.user.id;
    } else if (usuario_id) {
      // Admin/Bibliotecario pueden filtrar por usuario específico
      filters.usuario_id = usuario_id;
    }
    
    if (estado) filters.estado = estado;
    
    const loans = await Loan.findAll(filters);
    res.json(loans);
  } catch (error) {
    console.error('Error en getLoans:', error);
    res.status(500).json({ error: 'Error al obtener préstamos' });
  }
};

/**
 * Obtener un préstamo específico
 * - Usuarios normales: solo pueden ver sus propios préstamos
 * - Admin/Bibliotecario: pueden ver cualquier préstamo
 */
exports.getLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    
    if (!loan) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    
    // Verificar permisos
    const isOwner = loan.usuario_id === req.user.id;
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'bibliotecario';
    
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'No tienes permiso para ver este préstamo' });
    }
    
    res.json(loan);
  } catch (error) {
    console.error('Error en getLoan:', error);
    res.status(500).json({ error: 'Error al obtener préstamo' });
  }
};

/**
 * Crear un nuevo préstamo
 * - Usuarios normales: solo pueden crear préstamos para ellos mismos
 * - Admin/Bibliotecario: pueden crear préstamos para cualquier usuario
 */
exports.createLoan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { usuario_id, libro_id, dias_prestamo } = req.body;
    
    // Verificar permisos
    const isCreatingForSelf = usuario_id == req.user.id;
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'bibliotecario';
    
    if (!isCreatingForSelf && !isStaff) {
      return res.status(403).json({ error: 'No tienes permiso para crear este préstamo' });
    }
    
    // Verificar disponibilidad del libro
    const book = await Book.findById(libro_id);
    if (!book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    if (book.cantidad_disponible <= 0) {
      return res.status(400).json({ error: 'No hay ejemplares disponibles' });
    }
    
    // Crear préstamo
    const loan = await Loan.create({ usuario_id, libro_id, dias_prestamo });
    
    // Actualizar disponibilidad del libro
    await Book.updateAvailability(libro_id, -1);
    
    res.status(201).json(loan);
  } catch (error) {
    console.error('Error en createLoan:', error);
    res.status(500).json({ error: 'Error al crear préstamo' });
  }
};

/**
 * Registrar devolución de un préstamo
 * - Solo Admin/Bibliotecario pueden registrar devoluciones
 */
exports.returnLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_devolucion } = req.body;
    
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    
    // Verificar permisos: solo staff puede registrar devoluciones
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'bibliotecario';
    if (!isStaff) {
      return res.status(403).json({ error: 'No tienes permiso para registrar devoluciones' });
    }
    
    if (loan.estado === 'devuelto') {
      return res.status(400).json({ error: 'Este préstamo ya fue devuelto' });
    }
    
    const returnedLoan = await Loan.returnBook(id, fecha_devolucion || new Date());
    
    // Actualizar disponibilidad del libro
    await Book.updateAvailability(loan.libro_id, 1);
    
    res.json(returnedLoan);
  } catch (error) {
    console.error('Error en returnLoan:', error);
    res.status(500).json({ error: 'Error al registrar devolución' });
  }
};

/**
 * Renovar un préstamo
 * - Usuarios normales: solo pueden renovar sus propios préstamos
 * - Admin/Bibliotecario: pueden renovar cualquier préstamo
 */
exports.renewLoan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    
    // Verificar permisos
    const isOwner = loan.usuario_id === req.user.id;
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'bibliotecario';
    
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'No tienes permiso para renovar este préstamo' });
    }
    
    if (loan.estado !== 'activo') {
      return res.status(400).json({ error: 'Solo se pueden renovar préstamos activos' });
    }
    
    if (loan.renovaciones >= 2) {
      return res.status(400).json({ error: 'Máximo de renovaciones alcanzado' });
    }
    
    const renewedLoan = await Loan.renewLoan(id);
    res.json(renewedLoan);
  } catch (error) {
    console.error('Error en renewLoan:', error);
    res.status(500).json({ error: 'Error al renovar préstamo' });
  }
};

/**
 * Obtener todos los préstamos activos
 * - Solo Admin/Bibliotecario tienen acceso
 */
exports.getActiveLoans = async (req, res) => {
  try {
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'bibliotecario';
    
    if (!isStaff) {
      return res.status(403).json({ error: 'No tienes permiso para ver todos los préstamos activos' });
    }
    
    const loans = await Loan.getActiveLoans();
    res.json(loans);
  } catch (error) {
    console.error('Error en getActiveLoans:', error);
    res.status(500).json({ error: 'Error al obtener préstamos activos' });
  }
};

/**
 * Obtener préstamos vencidos
 * - Solo Admin/Bibliotecario tienen acceso
 */
exports.getOverdueLoans = async (req, res) => {
  try {
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'bibliotecario';
    
    if (!isStaff) {
      return res.status(403).json({ error: 'No tienes permiso para ver préstamos vencidos' });
    }
    
    const loans = await Loan.checkOverdueLoans();
    res.json(loans);
  } catch (error) {
    console.error('Error en getOverdueLoans:', error);
    res.status(500).json({ error: 'Error al obtener préstamos vencidos' });
  }
};