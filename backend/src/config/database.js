const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biblioteca',
  password: process.env.DB_PASSWORD || 'linux',
  port: process.env.DB_PORT || 5432,
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Crear tabla usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'usuario',
        telefono VARCHAR(15),
        direccion TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT true
      )
    `);

    // Crear tabla categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT
      )
    `);

    // Crear tabla libros
    await client.query(`
      CREATE TABLE IF NOT EXISTS libros (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        autor VARCHAR(100) NOT NULL,
        isbn VARCHAR(13) UNIQUE,
        editorial VARCHAR(100),
        anio_publicacion INTEGER,
        categoria_id INTEGER REFERENCES categorias(id),
        cantidad_total INTEGER DEFAULT 1,
        cantidad_disponible INTEGER DEFAULT 1,
        ubicacion VARCHAR(50),
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla prestamos
    await client.query(`
      CREATE TABLE IF NOT EXISTS prestamos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        libro_id INTEGER REFERENCES libros(id),
        fecha_prestamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_devolucion_estimada DATE NOT NULL,
        fecha_devolucion_real DATE,
        estado VARCHAR(20) DEFAULT 'activo',
        renovaciones INTEGER DEFAULT 0
      )
    `);

    // Crear tabla multas
    await client.query(`
      CREATE TABLE IF NOT EXISTS multas (
        id SERIAL PRIMARY KEY,
        prestamo_id INTEGER REFERENCES prestamos(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        monto DECIMAL(10,2) NOT NULL,
        fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_pago DATE,
        estado VARCHAR(20) DEFAULT 'pendiente',
        dias_retraso INTEGER
      )
    `);

    // Insertar categorías por defecto
    await client.query(`
      INSERT INTO categorias (nombre, descripcion) 
      VALUES 
        ('Ficción', 'Libros de ficción y novelas'),
        ('No Ficción', 'Libros informativos y educativos'),
        ('Ciencia', 'Libros de ciencia y tecnología'),
        ('Historia', 'Libros históricos'),
        ('Arte', 'Libros de arte y cultura')
      ON CONFLICT (nombre) DO NOTHING
    `);

    // Insertar usuario administrador por defecto
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO usuarios (nombre, email, password, rol) 
      VALUES ('Administrador', 'admin@biblioteca.com', $1, 'administrador')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    await client.query('COMMIT');
    console.log('Tablas creadas exitosamente');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear tablas:', error);
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };