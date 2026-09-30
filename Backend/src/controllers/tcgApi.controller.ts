import type { Request, Response } from 'express';
import { tcgApiService } from '../services/tcgApi.service.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { ExternalApiError } from '../handlers/errorHandlers.js';
import { BuscarCartaSchema } from '../validations/tcgApi.validation.js';

export const tcgApiController = {
    buscarPorNombre: async (req: Request, res: Response) => {
        const { error, value } = BuscarCartaSchema.validate(req.query, { abortEarly: false });
        if (error) {
            sendError(res, 'Datos inválidos', error.details.map(detail => detail.message), 400);
            return;
        }
        try {
            const resultado = await tcgApiService.buscarCartas(value);
            sendSuccess(res, resultado, 'Cartas encontradas');
        } catch (error: any) {
            if (error instanceof ExternalApiError) {
                sendError(res, 'Error en la API externa', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    }
};