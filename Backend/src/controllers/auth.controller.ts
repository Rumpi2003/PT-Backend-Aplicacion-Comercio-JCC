import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js'
import { RegistrarUsuarioSchema, LoginUsuarioSchema } from '../validations/usuario.validation.js';

export const authController = {
    register: async (req: Request, res: Response) => {
        const { error, value } = RegistrarUsuarioSchema.validate(req.body, { abortEarly: false });
        if (error) {
            sendError(res, 'Datos inválidos', error.details.map(detail => detail.message), 400);
            return;
        }
        try {
            const result = await authService.register(value);
            sendSuccess(res, result, 'Usuario Registrado Correctamente');
        } catch (error: any) {
            sendError(res, 'Error al registrar el usuario', [error.message]);
        }
    },

    login: async (req: Request, res: Response) => {
        const { error, value } = LoginUsuarioSchema.validate(req.body, { abortEarly: false });
        if (error) {
            sendError(res, 'Datos inválidos', error.details.map(detail => detail.message), 400);
            return;
        }
        try {
            const result = await authService.login(value);
            sendSuccess(res, result);
        } catch (error: any) {
            sendError(res, 'Error al iniciar sesión', [error.message], 401);
        }
    }
}