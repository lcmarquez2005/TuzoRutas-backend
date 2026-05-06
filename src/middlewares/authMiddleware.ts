import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_tuzorutas_2026';

// Extendemos la interfaz Request de Express para poder inyectar los datos del usuario decodificado
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    res.status(403).json({ mensaje: 'No se proporcionó un token de autenticación en la cabecera Authorization.' });
    return;
  }

  // El formato esperado es "Bearer <token>"
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    res.status(400).json({ mensaje: 'Formato de token inválido. Debe ser "Bearer <token>".' });
    return;
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Inyectamos el usuario en la request
    next();
  } catch (error: any) {
    res.status(401).json({ mensaje: 'Token inválido o expirado.', error: error.message });
  }
};
