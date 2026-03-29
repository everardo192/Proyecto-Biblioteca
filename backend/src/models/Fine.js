const { pool } = require('../config/database');

class Fine {
  static async findAll(filters = {}) {
    let query = `
      SELECT m.*, u.nombre as usuario_nombre, u.email as usuario_email,
             p.id as prestamo_id, l.titulo as libro_titulo
      FROM multas m
      JOIN usuarios u ON m.usuario_id = u.id
      JOIN prestamos p ON m.prestamo_id = p.id
      JOIN libros l ON p.libro_id = l.id
      WHERE 1=1
    `;
    const values = [];
    let valueIndex = 1;

    if (filters.usuario_id) {
      query += ` AND m.usuario_id = $${valueIndex}`;
      values.push(filters.usuario_id);
      valueIndex++;
    }

    if (filters.estado) {
      query += ` AND m.estado = $${valueIndex}`;
      values.push(filters.estado);
      valueIndex++;
    }

    query += ` ORDER BY m.fecha_generacion DESC`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT m.*, u.nombre as usuario_nombre, u.email as usuario_email,
              p.id as prestamo_id, l.titulo as libro_titulo
       FROM multas m
       JOIN usuarios u ON m.usuario_id = u.id
       JOIN prestamos p ON m.prestamo_id = p.id
       JOIN libros l ON p.libro_id = l.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUser(usuario_id) {
    const result = await pool.query(
      `SELECT m.*, p.id as prestamo_id, l.titulo as libro_titulo
       FROM multas m
       JOIN prestamos p ON m.prestamo_id = p.id
       JOIN libros l ON p.libro_id = l.id
       WHERE m.usuario_id = $1 AND m.estado = 'pendiente'
       ORDER BY m.fecha_generacion DESC`,
      [usuario_id]
    );
    return result.rows;
  }

  static async create(fineData) {
    const { prestamo_id, usuario_id, monto, dias_retraso } = fineData;
    const result = await pool.query(
      `INSERT INTO multas (prestamo_id, usuario_id, monto, dias_retraso) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [prestamo_id, usuario_id, monto, dias_retraso]
    );
    return result.rows[0];
  }

  static async payFine(id, fecha_pago = new Date()) {
    const result = await pool.query(
      `UPDATE multas 
       SET estado = 'pagado', fecha_pago = $1 
       WHERE id = $2 AND estado = 'pendiente'
       RETURNING *`,
      [fecha_pago, id]
    );
    return result.rows[0];
  }

  static async getUserTotalFines(usuario_id) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total_pendiente
       FROM multas 
       WHERE usuario_id = $1 AND estado = 'pendiente'`,
      [usuario_id]
    );
    return parseFloat(result.rows[0].total_pendiente);
  }

  static async getTotalPending() {
    const result = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total_pendiente
       FROM multas 
       WHERE estado = 'pendiente'`
    );
    return parseFloat(result.rows[0].total_pendiente);
  }
}

module.exports = Fine;