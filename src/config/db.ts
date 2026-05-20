import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const { Pool } = pg;

// Crear un pool de conexiones con PostgreSQL
// Si existe POSTGRES_URL o DATABASE_URL (Vercel/Neon Postgres), lo priorizamos, si no, usamos variables locales
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const poolConfig = connectionString 
  ? { 
      connectionString: connectionString,
      // Vercel Postgres requiere SSL activado
      ssl: { rejectUnauthorized: false } 
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tuzorutas',
      // Activar SSL si el host es remoto (no localhost)
      ...(process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    };

const pool = new Pool(poolConfig);

// Comprobar la conexión al iniciar el backend
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error crítico al conectar a la base de datos PostgreSQL:', err.message);
  } else {
    console.log('✅ Conexión establecida correctamente con PostgreSQL.');
  }
});

export default pool;
