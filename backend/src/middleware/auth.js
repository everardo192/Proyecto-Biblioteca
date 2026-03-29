const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findById(decoded.id);
    
    if (!user || !user.activo) {
      throw new Error();
    }

    req.user = user;
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Por favor autentíquese' });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
    }
    
    next();
  };
};

module.exports = { authMiddleware, checkRole };