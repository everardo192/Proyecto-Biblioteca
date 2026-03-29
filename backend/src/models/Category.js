const { pool } = require('../config/database');

class Category {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM categorias ORDER BY nombre'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM categorias WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByName(nombre) {
    const result = await pool.query(
      'SELECT * FROM categorias WHERE nombre = $1',
      [nombre]
    );
    return result.rows[0];
  }

  static async create(categoryData) {
    const { nombre, descripcion } = categoryData;
    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    return result.rows[0];
  }

  static async update(id, categoryData) {
    const { nombre, descripcion } = categoryData;
    const result = await pool.query(
      'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [nombre, descripcion, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Verificar si hay libros en esta categoría
    const booksResult = await pool.query(
      'SELECT COUNT(*) FROM libros WHERE categoria_id = $1',
      [id]
    );
    
    if (parseInt(booksResult.rows[0].count) > 0) {
      throw new Error('No se puede eliminar la categoría porque tiene libros asociados');
    }
    
    const result = await pool.query(
      'DELETE FROM categorias WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async getBooksByCategory(id) {
    const result = await pool.query(
      `SELECT * FROM libros 
       WHERE categoria_id = $1 
       ORDER BY titulo`,
      [id]
    );
    return result.rows;
  }
}

module.exports = Category;