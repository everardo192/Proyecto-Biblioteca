const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

// Validaciones
const categoryValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido')
];

// Rutas públicas (requieren autenticación)
router.get('/', authMiddleware, categoryController.getCategories);
router.get('/:id', authMiddleware, categoryController.getCategory);
router.get('/:id/books', authMiddleware, categoryController.getBooksByCategory);

// Rutas para administradores y bibliotecarios
router.post('/', authMiddleware, checkRole('administrador', 'bibliotecario'), categoryValidation, categoryController.createCategory);
router.put('/:id', authMiddleware, checkRole('administrador', 'bibliotecario'), categoryValidation, categoryController.updateCategory);
router.delete('/:id', authMiddleware, checkRole('administrador'), categoryController.deleteCategory);

module.exports = router;