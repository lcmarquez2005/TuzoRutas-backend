import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rutasRouter from './routes/rutas.js';
import authRouter from './routes/auth.js';

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Habilita CORS para conectar tu app de Expo móvil sin bloqueos de red
app.use(express.json()); // Permite al servidor entender cuerpos de petición en formato JSON

// Ruta de estado general (Health Check)
app.get('/', (req, res) => {
  res.json({
    estado: 'online',
    servicio: 'TuzoRutas API REST',
    localizacion: 'Pachuca de Soto, Hidalgo',
    mensaje: 'Servidor operativo correctamente. Visita /api/rutas para obtener datos.',
    timestamp: new Date()
  });
});

// Registrar los ruteadores bajo sus prefijos correspondientes
app.use('/api/auth', authRouter);
app.use('/api/rutas', rutasRouter);

// Iniciar la escucha del servidor
// En Render/Docker necesitamos que el servidor escuche activamente.
// Vercel maneja la escucha de forma interna mediante la exportación del app.
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVIDOR TUZORUTAS INICIADO`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`====================================================`);
});

// Es obligatorio exportar la aplicación para que Vercel pueda procesarla si se usa esa plataforma
export default app;
