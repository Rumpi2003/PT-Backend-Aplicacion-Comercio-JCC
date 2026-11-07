import type { Request, Response } from 'express';
import { popularidadService } from '../services/popularidad.service.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';

export const popularidadController = {
    obtenerTop: async (_req: Request, res: Response) => {
        try {
            const cartas = await popularidadService.obtenerTop();
            sendSuccess(res, cartas, 'Ranking de popularidad obtenido con éxito', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);
        }
    }
};
