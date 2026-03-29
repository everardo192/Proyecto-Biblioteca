const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, telefono, direccion, fecha_registro, activo FROM usuarios WHERE activo = true ORDER BY nombre'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, telefono, direccion, fecha_registro, activo FROM usuarios WHERE id = $1 AND activo = true',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { nombre, email, password, rol = 'usuario', telefono, direccion } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, telefono, direccion) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, nombre, email, rol, telefono, direccion`,
      [nombre, email, hashedPassword, rol, telefono, direccion]
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const { nombre, email, rol, telefono, direccion, activo } = userData;
    
    // Construir la consulta dinámicamente basada en los campos proporcionados
    const updates = [];
    const values = [];
    let valueIndex = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${valueIndex}`);
      values.push(nombre);
      valueIndex++;
    }
    
    if (email !== undefined) {
      updates.push(`email = $${valueIndex}`);
      values.push(email);
      valueIndex++;
    }
    
    if (rol !== undefined) {
      updates.push(`rol = $${valueIndex}`);
      values.push(rol);
      valueIndex++;
    }
    
    if (telefono !== undefined) {
      updates.push(`telefono = $${valueIndex}`);
      values.push(telefono);
      valueIndex++;
    }
    
    if (direccion !== undefined) {
      updates.push(`direccion = $${valueIndex}`);
      values.push(direccion);
      valueIndex++;
    }
    
    if (activo !== undefined) {
      updates.push(`activo = $${valueIndex}`);
      values.push(activo);
      valueIndex++;
    }
    
    if (updates.length === 0) {
      return null;
    }
    
    values.push(id);
    
    const query = `
      UPDATE usuarios 
      SET ${updates.join(', ')} 
      WHERE id = $${valueIndex} 
      RETURNING id, nombre, email, rol, telefono, direccion, activo
    `;
    
    console.log('Query de actualización:', query);
    console.log('Valores:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'UPDATE usuarios SET activo = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async getLoanHistory(id) {
    const result = await pool.query(
      `SELECT p.*, l.titulo as libro_titulo, l.autor as libro_autor 
       FROM prestamos p 
       JOIN libros l ON p.libro_id = l.id 
       WHERE p.usuario_id = $1 
       ORDER BY p.fecha_prestamo DESC
       LIMIT 20`,
      [id]
    );
    return result.rows;
  }
}

module.exports = User;