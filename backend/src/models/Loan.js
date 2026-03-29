const { pool } = require('../config/database');

class Loan {
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email, 
             l.titulo as libro_titulo, l.autor as libro_autor
      FROM prestamos p 
      JOIN usuarios u ON p.usuario_id = u.id 
      JOIN libros l ON p.libro_id = l.id 
      WHERE 1=1
    `;
    const values = [];
    let valueIndex = 1;

    if (filters.usuario_id) {
      query += ` AND p.usuario_id = $${valueIndex}`;
      values.push(filters.usuario_id);
      valueIndex++;
    }

    if (filters.estado) {
      query += ` AND p.estado = $${valueIndex}`;
      values.push(filters.estado);
      valueIndex++;
    }

    query += ` ORDER BY p.fecha_prestamo DESC LIMIT 100`; // Limitar resultados
    
    console.log('Ejecutando query:', query);
    console.log('Con valores:', values);
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT p.*, u.nombre as usuario_nombre, l.titulo as libro_titulo 
       FROM prestamos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       JOIN libros l ON p.libro_id = l.id 
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(loanData) {
    const { usuario_id, libro_id, dias_prestamo = 7 } = loanData;
    
    const fecha_devolucion_estimada = new Date();
    fecha_devolucion_estimada.setDate(fecha_devolucion_estimada.getDate() + dias_prestamo);
    
    const result = await pool.query(
      `INSERT INTO prestamos (usuario_id, libro_id, fecha_devolucion_estimada) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [usuario_id, libro_id, fecha_devolucion_estimada]
    );
    return result.rows[0];
  }

  static async returnBook(loanId, fecha_devolucion_real = new Date()) {
    const result = await pool.query(
      `UPDATE prestamos 
       SET fecha_devolucion_real = $1, estado = 'devuelto' 
       WHERE id = $2 AND estado = 'activo' 
       RETURNING *`,
      [fecha_devolucion_real, loanId]
    );
    
    if (result.rows[0]) {
      // Verificar si hay retraso
      const loan = result.rows[0];
      const fechaEstimada = new Date(loan.fecha_devolucion_estimada);
      const fechaReal = new Date(fecha_devolucion_real);
      
      if (fechaReal > fechaEstimada) {
        const diasRetraso = Math.ceil((fechaReal - fechaEstimada) / (1000 * 60 * 60 * 24));
        const monto = diasRetraso * 1000; // $1000 por día de retraso
        
        await pool.query(
          `INSERT INTO multas (prestamo_id, usuario_id, monto, dias_retraso) 
           VALUES ($1, $2, $3, $4)`,
          [loan.id, loan.usuario_id, monto, diasRetraso]
        );
      }
    }
    
    return result.rows[0];
  }

  static async renewLoan(loanId) {
    const result = await pool.query(
      `UPDATE prestamos 
       SET renovaciones = renovaciones + 1, 
           fecha_devolucion_estimada = fecha_devolucion_estimada + INTERVAL '7 days'
       WHERE id = $1 AND renovaciones < 2 AND estado = 'activo'
       RETURNING *`,
      [loanId]
    );
    return result.rows[0];
  }

  static async getActiveLoans() {
    const result = await pool.query(
      `SELECT p.*, u.nombre as usuario_nombre, l.titulo as libro_titulo 
       FROM prestamos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       JOIN libros l ON p.libro_id = l.id 
       WHERE p.estado = 'activo' 
       ORDER BY p.fecha_devolucion_estimada`
    );
    return result.rows;
  }

  static async checkOverdueLoans() {
    const result = await pool.query(
      `SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email 
       FROM prestamos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.estado = 'activo' 
       AND p.fecha_devolucion_estimada < CURRENT_DATE`
    );
    return result.rows;
  }
}

module.exports = Loan;