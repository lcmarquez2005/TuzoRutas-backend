-- ====================================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETO: TUZORUTAS (PRODUCCIÓN)
-- ====================================================================

-- 1. EXTENSIONES (REQUERIDO PARA BÚSQUEDA ESPACIAL)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'chofer',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE RUTAS
CREATE TABLE IF NOT EXISTS rutas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#800000',
    distancia_km DECIMAL(5, 2) DEFAULT 0.00,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE COORDENADAS DE TRAYECTORIA
CREATE TABLE IF NOT EXISTS coordenadas_trayectoria (
    id SERIAL PRIMARY KEY,
    ruta_id INT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    orden INT NOT NULL,
    CONSTRAINT fk_ruta_trayectoria FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_coordenadas_ruta ON coordenadas_trayectoria(ruta_id);

-- 5. TABLA DE PARADAS
CREATE TABLE IF NOT EXISTS paradas (
    id SERIAL PRIMARY KEY,
    ruta_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    orden INT NOT NULL,
    CONSTRAINT fk_ruta_paradas FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_paradas_ruta ON paradas(ruta_id);

-- 6. DATOS INICIALES (SEMILLAS)

-- Usuario: chofer_01 | Password: mi_password_seguro
-- Nota: Usamos el hash verificado $2b$10$U/cffZ0RcWG.iL5xDy58K.ids0BSrHfANbw1TMm2i8KwkFThCP5xy
INSERT INTO usuarios (usuario, password_hash, rol)
VALUES ('chofer_01', '$2b$10$U/cffZ0RcWG.iL5xDy58K.ids0BSrHfANbw1TMm2i8KwkFThCP5xy', 'chofer')
ON CONFLICT (usuario) DO NOTHING;

-- Usuario: root | Password: root
-- Nota: Usamos el hash verificado $2b$10$mPiG.nSLTUh9alyneLimReABZ5BFKO4AWWM0TxKXHGH.u0.8h0gPi
INSERT INTO usuarios (usuario, password_hash, rol)
VALUES ('root', '$2b$10$mPiG.nSLTUh9alyneLimReABZ5BFKO4AWWM0TxKXHGH.u0.8h0gPi', 'admin')
ON CONFLICT (usuario) DO NOTHING;


-- Ruta de ejemplo
INSERT INTO rutas (id, nombre, color, distancia_km) VALUES (1, 'Ruta Centro Ejemplo', '#FF0000', 0.85) ON CONFLICT (id) DO NOTHING;

-- Sincronizar secuencia de rutas después de insertar manualmente un ID
SELECT setval('rutas_id_seq', COALESCE((SELECT MAX(id) FROM rutas), 1));

-- Coordenadas de ejemplo
INSERT INTO coordenadas_trayectoria (ruta_id, latitud, longitud, orden) VALUES
(1, 20.10110000, -98.75910000, 1),
(1, 20.10200000, -98.75800000, 2),
(1, 20.10350000, -98.75650000, 3),
(1, 20.10500000, -98.75500000, 4)
ON CONFLICT DO NOTHING;

-- Paradas de ejemplo
INSERT INTO paradas (ruta_id, nombre, latitud, longitud, orden) VALUES
(1, 'Parada 1 Inicial', 20.10110000, -98.75910000, 1),
(1, 'Parada 2 Intermedia', 20.10500000, -98.75500000, 2)
ON CONFLICT DO NOTHING;
