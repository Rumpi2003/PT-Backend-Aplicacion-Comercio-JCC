import type { Request, Response } from 'express';
import { emparejamientoService } from '../services/emparejamiento.service.js';
import { ObtenerEmparejamientosQuerySchema } from '../validations/emparejamiento.validations.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { NotFoundError, ConflictError } from '../handlers/errorHandlers.js';

export const emparejamientoController = {
    obtenerEmparejamientos: async (req: Request, res: Response) => {
        const { error, value } = ObtenerEmparejamientosQuerySchema.validate(req.query);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await emparejamientoService.obtenerEmparejamientos(id, value);
            sendSuccess(res, resultado, 'Emparejamientos obtenidos con éxito', 200);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Usuario no encontrado', [error.message], error.statusCode);
            } else if (error instanceof ConflictError) {
                sendError(res, 'No se pueden calcular los emparejamientos', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    }
};
