import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Usaremos un secreto temporal si no existe en las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_tuzorutas_2026';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    res.status(400).json({ mensaje: 'Por favor, proporciona "usuario" y "password".' });
    return;
  }

  try {
    // 1. Buscar al usuario en la base de datos
    const userQuery = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
    
    if (userQuery.rows.length === 0) {
      res.status(401).json({ mensaje: 'Credenciales inválidas. Usuario no encontrado.' });
      return;
    }

    const user = userQuery.rows[0];

    // 2. Verificar la contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      res.status(401).json({ mensaje: 'Credenciales inválidas. Contraseña incorrecta.' });
      return;
    }

    // 3. Generar el token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        usuario: user.usuario, 
        rol: user.rol 
      },
      JWT_SECRET,
      { expiresIn: '24h' } // El token expirará en 24 horas
    );

    // 4. Devolver el token
    res.status(200).json({
      mensaje: 'Login exitoso',
      token
    });

  } catch (error: any) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({ mensaje: 'Error interno del servidor al intentar iniciar sesión.' });
  }
};
