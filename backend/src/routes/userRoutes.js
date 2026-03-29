const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const router = express.Router();

// Validaciones reutilizables
const userValidation = [
  body('nombre')
    .if(body('nombre').exists())
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('email')
    .if(body('email').exists())
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .if(body('password').exists())
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('rol')
    .if(body('rol').exists())
    .isIn(['usuario', 'bibliotecario', 'administrador']).withMessage('Rol inválido'),
  
  body('telefono')
    .if(body('telefono').exists())
    .trim()
    .isLength({ max: 15 }).withMessage('El teléfono no puede exceder 15 caracteres'),
  
  body('direccion')
    .if(body('direccion').exists())
    .trim()
    .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),
  
  body('activo')
    .if(body('activo').exists())
    .isBoolean().withMessage('El estado debe ser verdadero o falso')
];

// Validación para crear usuario (campos requeridos)
const createUserValidation = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('rol')
    .optional()
    .isIn(['usuario', 'bibliotecario', 'administrador']).withMessage('Rol inválido'),
  
  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 15 }).withMessage('El teléfono no puede exceder 15 caracteres'),
  
  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los usuarios (solo admin/bibliotecario)
router.get('/', checkRole('administrador', 'bibliotecario'), userController.getUsers);

// Crear nuevo usuario (solo admin)
router.post('/', checkRole('administrador'), createUserValidation, userController.createUser);

// Obtener usuario por ID (admin/bibliotecario o el propio usuario)
router.get('/:id', userController.getUser);

// Actualizar usuario (admin o el propio usuario)
router.put('/:id', userValidation, userController.updateUser);

// Eliminar usuario (solo admin)
router.delete('/:id', checkRole('administrador'), userController.deleteUser);

// Obtener préstamos del usuario (admin/bibliotecario o el propio usuario)
router.get('/:id/loans', userController.getUserLoans);

module.exports = router;