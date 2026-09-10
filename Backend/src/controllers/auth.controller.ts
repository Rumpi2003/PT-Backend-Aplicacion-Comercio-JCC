import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js'
import { ConflictError, CredentialError } from '../handlers/errorHandlers.js';
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
            sendSuccess(res, result, 'Usuario Registrado Correctamente', 201);
        } catch (error: any) {
            if (error instanceof ConflictError) {
                sendError(res, 'Conflicto de datos', [error.message], 409);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
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
            if (error instanceof CredentialError) {
                sendError(res, 'Credenciales incorrectas', [error.message], 401);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    }
}