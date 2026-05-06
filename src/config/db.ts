import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const { Pool } = pg;

// Crear un pool de conexiones con PostgreSQL utilizando las variables de entorno
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tuzorutas',
});

// Comprobar la conexión al iniciar el backend
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error crítico al conectar a la base de datos PostgreSQL:', err.message);
  } else {
    console.log('✅ Conexión establecida correctamente con PostgreSQL.');
  }
});

export default pool;
