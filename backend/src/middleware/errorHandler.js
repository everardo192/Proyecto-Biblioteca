const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Error de base de datos
  if (err.code === '23505') {
    return res.status(400).json({
      error: 'Violación de unicidad',
      details: 'Ya existe un registro con ese valor único'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Violación de clave foránea',
      details: 'El registro referencia a otro que no existe'
    });
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      details: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      details: 'Por favor, inicie sesión nuevamente'
    });
  }

  // Error por defecto
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error inesperado'
  });
};

module.exports = errorHandler;