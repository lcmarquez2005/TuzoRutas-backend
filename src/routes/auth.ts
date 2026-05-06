import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

// Endpoint para autenticación de operadores/administradores
router.post('/login', login);

export default router;
