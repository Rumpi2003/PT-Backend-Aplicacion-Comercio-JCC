import type { Request, Response } from 'express';
import { tcgApiService } from '../services/tcgApi.service.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { ExternalApiError } from '../handlers/errorHandlers.js';
import { BuscarCartaSchema, ListarSetsSchema } from '../validations/tcgApi.validation.js';

export const tcgApiController = {
    listarTcgs: async (req: Request, res: Response) => {
        try {
            const tcgs = await tcgApiService.listarTcgs();
            sendSuccess(res, tcgs, 'TCGs encontrados');
        } catch (error: any) {
            if (error instanceof ExternalApiError) {
                sendError(res, 'Error en la API externa', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    listarSets: async (req: Request, res: Response) => {
        const { error, value } = ListarSetsSchema.validate(req.query, { abortEarly: false });
        if (error) {
            sendError(res, 'Datos inválidos', error.details.map(detail => detail.message), 400);
            return;
        }
        const { tcg } = value;
        try {
            const sets = await tcgApiService.listarSets(tcg);
            sendSuccess(res, sets, 'Sets encontrados');
        } catch (error: any) {
            if (error instanceof ExternalApiError) {
                sendError(res, 'Error en la API externa', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

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