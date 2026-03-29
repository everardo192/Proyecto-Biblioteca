const Fine = require('../models/Fine');
const { validationResult } = require('express-validator');

exports.getFines = async (req, res) => {
  try {
    const { usuario_id, estado } = req.query;
    const filters = {};
    
    if (usuario_id) filters.usuario_id = usuario_id;
    if (estado) filters.estado = estado;
    
    const fines = await Fine.findAll(filters);
    res.json(fines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener multas' });
  }
};

exports.getFine = async (req, res) => {
  try {
    const { id } = req.params;
    const fine = await Fine.findById(id);
    
    if (!fine) {
      return res.status(404).json({ error: 'Multa no encontrada' });
    }
    
    res.json(fine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener multa' });
  }
};

exports.payFine = async (req, res) => {
  try {
    const { id } = req.params;
    const fine = await Fine.payFine(id);
    
    if (!fine) {
      return res.status(404).json({ error: 'Multa no encontrada o ya fue pagada' });
    }
    
    res.json({ message: 'Multa pagada exitosamente', fine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al pagar multa' });
  }
};

exports.getUserFines = async (req, res) => {
  try {
    const { id } = req.params;
    const fines = await Fine.findByUser(id);
    res.json(fines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener multas del usuario' });
  }
};

exports.getTotalPending = async (req, res) => {
  try {
    const total = await Fine.getTotalPending();
    res.json({ total_pendiente: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener total de multas pendientes' });
  }
};