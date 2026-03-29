const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.getUsers = async (req, res) => {
  try {
    if (req.user.rol !== 'administrador' && req.user.rol !== 'bibliotecario') {
      return res.status(403).json({ error: 'No tienes permiso para ver la lista de usuarios' });
    }
    
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.rol !== 'administrador' && 
        req.user.rol !== 'bibliotecario' && 
        parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este usuario' });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error en getUser:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Error de validación',
        details: errors.array() 
      });
    }
    
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios' });
    }

    const { nombre, email, password, rol, telefono, direccion } = req.body;
    
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const user = await User.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
      rol: rol || 'usuario',
      telefono: telefono || null,
      direccion: direccion || null
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Error de validación',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = parseInt(id);
    const currentUserId = req.user.id;
    const userRole = req.user.rol;
    
    console.log('Actualizando usuario:', { userId, currentUserId, userRole });
    console.log('Datos recibidos:', req.body);
    
    if (userRole !== 'administrador' && userId !== currentUserId) {
      return res.status(403).json({ 
        error: 'No tienes permiso para actualizar este usuario',
        details: 'Solo puedes actualizar tu propio perfil o ser administrador'
      });
    }
    
    const { nombre, email, rol, telefono, direccion, activo } = req.body;
    const updateData = {};
    
    if (nombre !== undefined && nombre.trim() !== '') {
      updateData.nombre = nombre.trim();
    }
    
    if (email !== undefined && email.trim() !== '') {
      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Email inválido' });
      }
      updateData.email = email.trim().toLowerCase();
    }
    
    if (telefono !== undefined) {
      updateData.telefono = telefono || null;
    }
    
    if (direccion !== undefined) {
      updateData.direccion = direccion || null;
    }
    
    if (userRole !== 'administrador') {
      if (rol !== undefined || activo !== undefined) {
        return res.status(403).json({ 
          error: 'No tienes permiso para cambiar el rol o estado del usuario' 
        });
      }
    } else {
      if (rol !== undefined) {
        const validRoles = ['usuario', 'bibliotecario', 'administrador'];
        if (!validRoles.includes(rol)) {
          return res.status(400).json({ error: 'Rol inválido' });
        }
        updateData.rol = rol;
      }
      
      if (activo !== undefined) {
        updateData.activo = activo === true || activo === 'true';
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    
    console.log('Datos a actualizar:', updateData);
    
    const user = await User.update(userId, updateData);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar usuarios' });
    }
    
    const user = await User.delete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

exports.getUserLoans = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.rol !== 'administrador' && 
        req.user.rol !== 'bibliotecario' && 
        parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver los préstamos de este usuario' });
    }
    
    const loans = await User.getLoanHistory(id);
    res.json(loans);
  } catch (error) {
    console.error('Error en getUserLoans:', error);
    res.status(500).json({ error: 'Error al obtener préstamos del usuario' });
  }
};