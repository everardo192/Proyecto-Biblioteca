const express = require('express');
const { body } = require('express-validator');
const loanController = require('../controllers/loanController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * VALIDACIONES
 * Define las reglas de validación para crear/actualizar préstamos
 */
const loanValidation = [
  body('usuario_id')
    .isInt()
    .withMessage('ID de usuario inválido'),
  body('libro_id')
    .isInt()
    .withMessage('ID de libro inválido'),
  body('dias_prestamo')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Los días de préstamo deben estar entre 1 y 30')
];

const returnValidation = [
  body('fecha_devolucion')
    .optional()
    .isISO8601()
    .withMessage('Formato de fecha inválido (use ISO 8601)')
];

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * Todas las rutas requieren autenticación
 */
router.use(authMiddleware);

/**
 * ==========================================
 * RUTAS DE LECTURA
 * ==========================================
 */

/**
 * GET /loans
 * Obtener lista de préstamos
 * - Usuarios normales: ven solo sus propios préstamos
 * - Admin/Bibliotecario: ven todos o pueden filtrar por usuario
 * 
 * Query params:
 *   - usuario_id: (solo admin) filtrar por usuario
 *   - estado: filtrar por estado (activo, devuelto, vencido)
 * 
 * Acceso: Todos los usuarios autenticados
 */
router.get('/', loanController.getLoans);

/**
 * GET /loans/active
 * Obtener todos los préstamos activos del sistema
 * 
 * Acceso: Solo Admin/Bibliotecario
 */
router.get(
  '/active',
  checkRole('administrador', 'bibliotecario'),
  loanController.getActiveLoans
);

/**
 * GET /loans/overdue
 * Obtener todos los préstamos vencidos del sistema
 * 
 * Acceso: Solo Admin/Bibliotecario
 */
router.get(
  '/overdue',
  checkRole('administrador', 'bibliotecario'),
  loanController.getOverdueLoans
);

/**
 * GET /loans/:id
 * Obtener detalles de un préstamo específico
 * - Usuarios normales: solo pueden ver sus propios préstamos
 * - Admin/Bibliotecario: pueden ver cualquier préstamo
 * 
 * Params:
 *   - id: ID del préstamo
 * 
 * Acceso: Propietario o Staff
 */
router.get('/:id', loanController.getLoan);

/**
 * ==========================================
 * RUTAS DE CREACIÓN
 * ==========================================
 */

/**
 * POST /loans
 * Crear un nuevo préstamo
 * - Usuarios normales: solo pueden crear para ellos mismos
 * - Admin/Bibliotecario: pueden crear para cualquier usuario
 * 
 * Body:
 *   - usuario_id: ID del usuario que toma el préstamo (requerido)
 *   - libro_id: ID del libro (requerido)
 *   - dias_prestamo: Duración en días, 1-30 (opcional, default según config)
 * 
 * Acceso: Todos los usuarios autenticados
 *         (el controller valida que usuarios normales solo creen para ellos)
 */
router.post(
  '/',
  loanValidation,
  loanController.createLoan
);

/**
 * ==========================================
 * RUTAS DE ACTUALIZACIÓN
 * ==========================================
 */

/**
 * PUT /loans/:id/renew
 * Renovar un préstamo activo
 * - Usuarios normales: solo pueden renovar sus propios préstamos
 * - Admin/Bibliotecario: pueden renovar cualquier préstamo
 * 
 * Límites:
 *   - Máximo 2 renovaciones por préstamo
 *   - Solo préstamos en estado "activo"
 * 
 * Params:
 *   - id: ID del préstamo
 * 
 * Acceso: Propietario o Staff
 */
router.put(
  '/:id/renew',
  loanController.renewLoan
);

/**
 * PUT /loans/:id/return
 * Registrar la devolución de un préstamo
 * 
 * Body:
 *   - fecha_devolucion: Fecha de devolución (opcional, default ahora)
 * 
 * Params:
 *   - id: ID del préstamo
 * 
 * Acceso: Solo Admin/Bibliotecario
 */
router.put(
  '/:id/return',
  checkRole('administrador', 'bibliotecario'),
  returnValidation,
  loanController.returnLoan
);

module.exports = router;