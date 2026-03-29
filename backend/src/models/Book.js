const { pool } = require('../config/database');

class Book {
  static async findAll(filters = {}) {
    let query = `
      SELECT l.*, c.nombre as categoria_nombre 
      FROM libros l 
      LEFT JOIN categorias c ON l.categoria_id = c.id 
      WHERE l.cantidad_total > 0
    `;
    const values = [];
    let valueIndex = 1;

    if (filters.titulo) {
      query += ` AND l.titulo ILIKE $${valueIndex}`;
      values.push(`%${filters.titulo}%`);
      valueIndex++;
    }

    if (filters.autor) {
      query += ` AND l.autor ILIKE $${valueIndex}`;
      values.push(`%${filters.autor}%`);
      valueIndex++;
    }

    if (filters.categoria_id) {
      query += ` AND l.categoria_id = $${valueIndex}`;
      values.push(filters.categoria_id);
      valueIndex++;
    }

    query += ` ORDER BY l.titulo`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT l.*, c.nombre as categoria_nombre 
       FROM libros l 
       LEFT JOIN categorias c ON l.categoria_id = c.id 
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(bookData) {
    const { titulo, autor, isbn, editorial, anio_publicacion, categoria_id, cantidad_total, ubicacion, descripcion } = bookData;
    
    const result = await pool.query(
      `INSERT INTO libros (titulo, autor, isbn, editorial, anio_publicacion, categoria_id, cantidad_total, cantidad_disponible, ubicacion, descripcion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9) 
       RETURNING *`,
      [titulo, autor, isbn, editorial, anio_publicacion, categoria_id, cantidad_total, ubicacion, descripcion]
    );
    return result.rows[0];
  }

  static async update(id, bookData) {
    const { titulo, autor, isbn, editorial, anio_publicacion, categoria_id, cantidad_total, ubicacion, descripcion } = bookData;
    
    const result = await pool.query(
      `UPDATE libros 
       SET titulo = $1, autor = $2, isbn = $3, editorial = $4, 
           anio_publicacion = $5, categoria_id = $6, cantidad_total = $7, 
           ubicacion = $8, descripcion = $9
       WHERE id = $10 
       RETURNING *`,
      [titulo, autor, isbn, editorial, anio_publicacion, categoria_id, cantidad_total, ubicacion, descripcion, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'UPDATE libros SET cantidad_total = 0, cantidad_disponible = 0 WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async updateAvailability(id, change) {
    const result = await pool.query(
      `UPDATE libros 
       SET cantidad_disponible = cantidad_disponible + $1 
       WHERE id = $2 AND cantidad_disponible + $1 >= 0 
       RETURNING cantidad_disponible`,
      [change, id]
    );
    return result.rows[0];
  }

  static async getMostLoaned(limit = 10) {
    const result = await pool.query(
      `SELECT l.*, COUNT(p.id) as prestamos_count 
       FROM libros l 
       LEFT JOIN prestamos p ON l.id = p.libro_id 
       GROUP BY l.id 
       ORDER BY prestamos_count DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = Book;