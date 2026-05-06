-- ====================================================================
-- SCRIPT DE CREACIÓN DE LA TABLA DE USUARIOS Y SEMILLA
-- ====================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'chofer',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertamos al usuario base "chofer_01" con la contraseña "mi_password_seguro"
-- Para propósitos de este script de inicialización rápida, insertamos el hash bcrypt 
-- correspondiente a "mi_password_seguro" (costo 10).
-- Generado con: bcrypt.hashSync('mi_password_seguro', 10)
INSERT INTO usuarios (usuario, password_hash, rol)
VALUES (
    'chofer_01', 
    '$2b$10$wT0/K0fKkX1g.U/3bOa8K.2wL4uG8W5H8wH0n9H3E4D6U9V8n5O7m', 
    'chofer'
) ON CONFLICT (usuario) DO NOTHING;
