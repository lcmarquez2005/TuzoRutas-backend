import { Request, Response } from 'express';
import pool from '../config/db.js';

// Interfaces para tipar la respuesta internamente en el controlador
interface CoordenadaDB {
  id: number;
  ruta_id: number;
  latitud: string;
  longitud: string;
  orden: number;
}

interface ParadaDB {
  id: number;
  ruta_id: number;
  nombre: string;
  latitud: string;
  longitud: string;
  orden: number;
}

interface RutaDB {
  id: number;
  nombre: string;
  color: string;
  distancia_km: string;
  creado_en: Date;
}

/**
 * GET /api/rutas
 * Obtiene todas las rutas activas de la base de datos junto con su trayectoria y paradas.
 */
export const obtenerRutas = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Ejecutar las consultas de forma concurrente para mayor velocidad
    const [rutasQuery, trayectoriaQuery, paradasQuery] = await Promise.all([
      pool.query<RutaDB>('SELECT * FROM rutas ORDER BY id ASC'),
      pool.query<CoordenadaDB>('SELECT * FROM coordenadas_trayectoria ORDER BY ruta_id ASC, orden ASC'),
      pool.query<ParadaDB>('SELECT * FROM paradas ORDER BY ruta_id ASC, orden ASC'),
    ]);

    const dbRutas = rutasQuery.rows;
    const dbCoordenadas = trayectoriaQuery.rows;
    const dbParadas = paradasQuery.rows;

    // 2. Agrupar la información en un formato JSON estructurado idéntico a lo que espera la app móvil
    const rutasFormateadas = dbRutas.map((ruta) => {
      // Filtrar y formatear la trayectoria de esta ruta
      const trayectoria = dbCoordenadas
        .filter((c) => c.ruta_id === ruta.id)
        .map((c) => ({
          lat: parseFloat(c.latitud),
          lng: parseFloat(c.longitud),
        }));

      // Filtrar y formatear las paradas de esta ruta
      const paradas = dbParadas
        .filter((p) => p.ruta_id === ruta.id)
        .map((p) => ({
          nombre: p.nombre,
          lat: parseFloat(p.latitud),
          lng: parseFloat(p.longitud),
        }));

      return {
        id: ruta.id.toString(), // Convertimos el ID numérico a string para alinearlo con el frontend
        nombre: ruta.nombre,
        color: ruta.color,
        distancia_km: parseFloat(ruta.distancia_km),
        trayectoria,
        paradas,
      };
    });

    res.json(rutasFormateadas);
  } catch (error: any) {
    console.error('❌ Error en obtenerRutas:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener las rutas de la base de datos' });
  }
};

/**
 * POST /api/rutas
 * Crea una nueva ruta trazada desde el móvil con sus respectivas coordenadas de trayectoria y paradas.
 */
export const crearRuta = async (req: Request, res: Response): Promise<void> => {
  const { nombre, color, distancia_km, trayectoria, paradas } = req.body;

  // Validación básica de entrada
  if (!nombre || !trayectoria || !Array.isArray(trayectoria) || trayectoria.length === 0) {
    res.status(400).json({ 
      mensaje: 'Datos incompletos. Se requiere "nombre" y "trayectoria" con al menos una coordenada.' 
    });
    return;
  }

  const client = await pool.connect();

  try {
    // 1. Iniciar una transacción de base de datos
    await client.query('BEGIN');

    // 2. Insertar la cabecera de la ruta
    const insertarRutaSql = `
      INSERT INTO rutas (nombre, color, distancia_km) 
      VALUES ($1, $2, $3) 
      RETURNING id
    `;
    const rutaResponse = await client.query(insertarRutaSql, [
      nombre,
      color || '#800000',
      distancia_km || 0.0,
    ]);
    
    const nuevaRutaId = rutaResponse.rows[0].id;

    // 3. Insertar la trayectoria (coordenadas)
    const insertarCoordenadaSql = `
      INSERT INTO coordenadas_trayectoria (ruta_id, latitud, longitud, orden) 
      VALUES ($1, $2, $3, $4)
    `;
    
    // Insertamos secuencialmente manteniendo el índice de orden
    for (let i = 0; i < trayectoria.length; i++) {
      const coord = trayectoria[i];
      if (coord.lat === undefined || coord.lng === undefined) {
        throw new Error(`Coordenada en índice ${i} es inválida. Debe tener lat y lng.`);
      }
      await client.query(insertarCoordenadaSql, [nuevaRutaId, coord.lat, coord.lng, i + 1]);
    }

    // 4. Insertar las paradas si existen
    if (paradas && Array.isArray(paradas) && paradas.length > 0) {
      const insertarParadaSql = `
        INSERT INTO paradas (ruta_id, nombre, latitud, longitud, orden) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      for (let j = 0; j < paradas.length; j++) {
        const parada = paradas[j];
        if (!parada.nombre || parada.lat === undefined || parada.lng === undefined) {
          throw new Error(`Parada en índice ${j} es inválida. Debe tener nombre, lat y lng.`);
        }
        await client.query(insertarParadaSql, [
          nuevaRutaId, 
          parada.nombre, 
          parada.lat, 
          parada.lng, 
          j + 1
        ]);
      }
    }

    // 5. Confirmar transacción
    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Ruta trazada y guardada exitosamente en el servidor',
      rutaId: nuevaRutaId,
    });
  } catch (error: any) {
    // Si algo falla, revertimos todos los inserts de la transacción
    await client.query('ROLLBACK');
    console.error('❌ Error en crearRuta (transacción cancelada):', error.message);
    res.status(500).json({ 
      mensaje: 'Hubo un error al guardar la ruta en el servidor', 
      error: error.message 
    });
  } finally {
    // Liberar el cliente de vuelta al pool
    client.release();
  }
};

/**
 * GET /api/rutas/cercanas
 * Obtiene las rutas que pasan a una distancia menor o igual al radio especificado.
 * Requiere lat, lng y radio en los query params.
 * Utiliza PostGIS ST_DWithin para optimización espacial.
 */
export const obtenerRutasCercanas = async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radio } = req.query;

  if (!lat || !lng || !radio) {
    res.status(400).json({ mensaje: 'Faltan parámetros requeridos: lat, lng, radio' });
    return;
  }

  const latNum = parseFloat(lat as string);
  const lngNum = parseFloat(lng as string);
  const radioNum = parseInt(radio as string, 10);

  if (isNaN(latNum) || isNaN(lngNum) || isNaN(radioNum)) {
    res.status(400).json({ mensaje: 'Los parámetros lat, lng y radio deben ser numéricos' });
    return;
  }

  try {
    // 1. Identificar las rutas que tienen al menos un punto de trayectoria dentro del radio
    // ST_MakePoint toma (longitud, latitud). Hacemos cast a ::geography para calcular en metros.
    const cercanasQuery = await pool.query<{ruta_id: number}>(`
      SELECT DISTINCT ruta_id 
      FROM coordenadas_trayectoria 
      WHERE ST_DWithin(
        ST_MakePoint(longitud::float, latitud::float)::geography, 
        ST_MakePoint($1, $2)::geography, 
        $3
      )
    `, [lngNum, latNum, radioNum]);

    const rutasIds = cercanasQuery.rows.map(row => row.ruta_id);

    if (rutasIds.length === 0) {
      // No hay rutas cercanas, regresamos un arreglo vacío
      res.json([]);
      return;
    }

    // 2. Obtener los datos completos (cabecera, trayectoria, paradas) SOLO de las rutas cercanas
    const rutasIdsParams = rutasIds.join(',');

    const [rutasQuery, trayectoriaQuery, paradasQuery] = await Promise.all([
      pool.query<RutaDB>(`SELECT * FROM rutas WHERE id IN (${rutasIdsParams}) ORDER BY id ASC`),
      pool.query<CoordenadaDB>(`SELECT * FROM coordenadas_trayectoria WHERE ruta_id IN (${rutasIdsParams}) ORDER BY ruta_id ASC, orden ASC`),
      pool.query<ParadaDB>(`SELECT * FROM paradas WHERE ruta_id IN (${rutasIdsParams}) ORDER BY ruta_id ASC, orden ASC`),
    ]);

    const dbRutas = rutasQuery.rows;
    const dbCoordenadas = trayectoriaQuery.rows;
    const dbParadas = paradasQuery.rows;

    // 3. Agrupar la información en formato JSON
    const rutasFormateadas = dbRutas.map((ruta) => {
      const trayectoria = dbCoordenadas
        .filter((c) => c.ruta_id === ruta.id)
        .map((c) => ({
          lat: parseFloat(c.latitud),
          lng: parseFloat(c.longitud),
        }));

      const paradas = dbParadas
        .filter((p) => p.ruta_id === ruta.id)
        .map((p) => ({
          nombre: p.nombre,
          lat: parseFloat(p.latitud),
          lng: parseFloat(p.longitud),
        }));

      return {
        id: ruta.id.toString(),
        nombre: ruta.nombre,
        color: ruta.color,
        distancia_km: parseFloat(ruta.distancia_km),
        trayectoria,
        paradas,
      };
    });

    res.json(rutasFormateadas);
  } catch (error: any) {
    console.error('❌ Error en obtenerRutasCercanas:', error.message);
    res.status(500).json({ mensaje: 'Error al calcular rutas cercanas en la base de datos' });
  }
};

