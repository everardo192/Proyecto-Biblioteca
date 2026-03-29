const express = require('express');
const { body } = require('express-validator');
const fineController = require('../controllers/fineController');
const { authMiddleware, checkRole } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas para usuarios autenticados
router.get('/', fineController.getFines);
router.get('/total-pending', checkRole('administrador', 'bibliotecario'), fineController.getTotalPending);
router.get('/:id', fineController.getFine);
router.put('/:id/pay', fineController.payFine);
router.get('/user/:id', checkRole('administrador', 'bibliotecario'), fineController.getUserFines);

module.exports = router;