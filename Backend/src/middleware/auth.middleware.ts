import { type Request, type Response, type NextFunction } from 'express';
import jwt, { type Jwt, type JwtPayload } from 'jsonwebtoken';
import { AppDataSource } from '../config/db.config.js';
import { Usuario, rolUsuario } from '../entities/usuario.entity.js';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id_usuario: number;
                correo: string;
                rol: rolUsuario;
            };
        }
    }
}

interface JwtUserPayload extends JwtPayload {
    id_usuario: number;
    correo: string;
}

// Valida el JWT y carga la cuenta desde la BD: el rol y la suspensión nunca se confían al token.
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response|void> => {
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

    let idUsuario: number;
    let correo: string;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object' || !('id_usuario' in decoded) || !('correo' in decoded)) {
            return res.status(401).json({
                status: 'error',
                mensaje: 'Token inválido'
            });
        }

        const user = decoded as JwtUserPayload;
        idUsuario = user.id_usuario;
        correo = user.correo;
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            mensaje: 'Token inválido o expirado'
        });
    }

    let cuenta: Pick<Usuario, 'id_usuario' | 'rol' | 'suspendido'> | null;
    try {
        cuenta = await AppDataSource.getRepository(Usuario).findOne({
            where: { id_usuario: idUsuario },
            select: { id_usuario: true, rol: true, suspendido: true }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            mensaje: 'Error interno del servidor'
        });
    }

    if (!cuenta) {
        return res.status(401).json({
            status: 'error',
            mensaje: 'Token inválido'
        });
    }

    if (cuenta.suspendido) {
        return res.status(403).json({
            status: 'error',
            mensaje: 'Cuenta suspendida'
        });
    }

    req.user = {
        id_usuario: cuenta.id_usuario,
        correo,
        rol: cuenta.rol
    };

    return next();
};

// Debe usarse después de `authMiddleware`; el rol ya viene de la BD, no del token.
export const requiereAdmin = (req: Request, res: Response, next: NextFunction): Response|void => {
    if (req.user?.rol !== rolUsuario.ADMIN) {
        return res.status(403).json({
            status: 'error',
            mensaje: 'Se requiere rol de administrador'
        });
    }
    return next();
};