const express = require('express');
const { body } = require('express-validator');
const bookController = require('../controllers/bookController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

// Validaciones más específicas
const bookValidation = [
  body('titulo')
    .notEmpty().withMessage('El título es requerido')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('El título debe tener entre 1 y 200 caracteres'),
  
  body('autor')
    .notEmpty().withMessage('El autor es requerido')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El autor debe tener entre 1 y 100 caracteres'),
  
  body('isbn')
    .optional()
    .trim()
    .isLength({ min: 10, max: 13 }).withMessage('ISBN debe tener entre 10 y 13 caracteres')
    .matches(/^[0-9-]+$/).withMessage('ISBN solo puede contener números y guiones'),
  
  body('editorial')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La editorial no puede exceder 100 caracteres'),
  
  body('anio_publicacion')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Año de publicación inválido'),
  
  body('categoria_id')
    .optional()
    .isInt().withMessage('ID de categoría inválido'),
  
  body('cantidad_total')
    .isInt({ min: 1, max: 9999 }).withMessage('La cantidad debe ser entre 1 y 9999'),
  
  body('ubicacion')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La ubicación no puede exceder 50 caracteres'),
  
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

// Rutas públicas (requieren autenticación pero no rol específico)
router.get('/', authMiddleware, bookController.getBooks);
router.get('/most-loaned', authMiddleware, bookController.getMostLoanedBooks);
router.get('/:id', authMiddleware, bookController.getBook);

// Rutas para administradores y bibliotecarios
router.post('/', 
  authMiddleware, 
  checkRole('administrador', 'bibliotecario'), 
  bookValidation, 
  bookController.createBook
);

router.put('/:id', 
  authMiddleware, 
  checkRole('administrador', 'bibliotecario'), 
  bookValidation, 
  bookController.updateBook
);

router.delete('/:id', 
  authMiddleware, 
  checkRole('administrador'), 
  bookController.deleteBook
);

module.exports = router;