import { type Request, type Response, type NextFunction } from 'express';
import jwt, { type Jwt, type JwtPayload } from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id_usuario: number;
                correo: string;
            };
        }
    }
}

interface JwtUserPayload extends JwtPayload {
    id_usuario: number;
    correo: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): Response|void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            mensaje: 'Token no proporcionado'
        });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
        return res.status(401).json({
            status: 'error',
            mensaje: 'Token inválido'
        });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        return res.status(500).json({
            status: 'error',
            mensaje: 'JWT_SECRET no está definida'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object' || !('id_usuario' in decoded) || !('correo' in decoded)) {
            return res.status(401).json({
                status: 'error',
                mensaje: 'Token inválido'
            });
        }

        const user = decoded as JwtUserPayload;

        req.user = {
            id_usuario: user.id_usuario,
            correo: user.correo
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            mensaje: 'Token inválido o expirado'
        });
    }
};