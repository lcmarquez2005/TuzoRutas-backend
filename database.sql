-- ====================================================================
-- SCRIPT DE INICIALIZACIÓN DE LA BASE DE DATOS: TUZORUTAS
-- ====================================================================
-- Puedes ejecutar este archivo en tu cliente SQL favorito (ej: pgAdmin, DBeaver)
-- para inicializar las tablas necesarias de PostgreSQL.

-- OPCIONAL (Recomendado para producción futura):
-- Si deseas activar las capacidades geográficas avanzadas en PostgreSQL,
-- puedes habilitar la extensión PostGIS ejecutando la siguiente línea (requiere permisos de superusuario):
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- --------------------------------------------------------------------
-- 1. CREACIÓN DE LA TABLA DE RUTAS (Cabecera)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rutas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#800000', -- Código hexadecimal (ej: #800000, #FF0000, #1E90FF)
    distancia_km DECIMAL(5, 2) DEFAULT 0.00,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 2. CREACIÓN DE LA TABLA DE COORDENADAS DE TRAYECTORIA
-- --------------------------------------------------------------------
-- Almacena los puntos geográficos secuenciales que componen la ruta.
-- El campo 'orden' asegura que podamos conectar los puntos en la secuencia original.
CREATE TABLE IF NOT EXISTS coordenadas_trayectoria (
    id SERIAL PRIMARY KEY,
    ruta_id INT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    orden INT NOT NULL,
    CONSTRAINT fk_ruta_trayectoria
        FOREIGN KEY (ruta_id) 
        REFERENCES rutas(id) 
        ON DELETE CASCADE
);

-- Creación de un índice para acelerar consultas filtradas por ruta_id
CREATE INDEX IF NOT EXISTS idx_coordenadas_ruta ON coordenadas_trayectoria(ruta_id);

-- --------------------------------------------------------------------
-- 3. CREACIÓN DE LA TABLA DE PARADAS (Markers)
-- --------------------------------------------------------------------
-- Almacena las paradas oficiales asignadas a cada una de las rutas.
CREATE TABLE IF NOT EXISTS paradas (
    id SERIAL PRIMARY KEY,
    ruta_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    orden INT NOT NULL,
    CONSTRAINT fk_ruta_paradas
        FOREIGN KEY (ruta_id) 
        REFERENCES rutas(id) 
        ON DELETE CASCADE
);

-- Creación de un índice para acelerar consultas filtradas por paradas
CREATE INDEX IF NOT EXISTS idx_paradas_ruta ON paradas(ruta_id);

-- --------------------------------------------------------------------
-- 4. INSERT DE DATOS INICIALES DE PRUEBA (Opcional)
-- --------------------------------------------------------------------
-- Insertar una ruta de ejemplo para comprobar el funcionamiento:
INSERT INTO rutas (nombre, color, distancia_km) 
VALUES ('Ruta Centro Ejemplo', '#FF0000', 0.85);

-- Supongamos que el ID generado es 1. Insertamos sus coordenadas de ejemplo:
INSERT INTO coordenadas_trayectoria (ruta_id, latitud, longitud, orden) VALUES
(1, 20.10110000, -98.75910000, 1),
(1, 20.10200000, -98.75800000, 2),
(1, 20.10350000, -98.75650000, 3),
(1, 20.10500000, -98.75500000, 4);

-- Insertar paradas de ejemplo para la ruta 1:
INSERT INTO paradas (ruta_id, nombre, latitud, longitud, orden) VALUES
(1, 'Parada 1 Inicial', 20.10110000, -98.75910000, 1),
(1, 'Parada 2 Intermedia', 20.10500000, -98.75500000, 2);
