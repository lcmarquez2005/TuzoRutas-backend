import { Router } from 'express';
import { obtenerRutas, crearRuta, obtenerRutasCercanas } from '../controllers/rutasController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint para listar todas las rutas registradas con sus trayectorias y paradas
router.get('/', obtenerRutas);

// Endpoint para obtener rutas cercanas a una ubicación geográfica (PostGIS ST_DWithin)
router.get('/cercanas', obtenerRutasCercanas);

// Endpoint para recibir y almacenar un nuevo trazado de ruta enviado desde el móvil
// IMPORTANTE: Este endpoint ahora está protegido por JWT
router.post('/', verifyToken, crearRuta);

export default router;
