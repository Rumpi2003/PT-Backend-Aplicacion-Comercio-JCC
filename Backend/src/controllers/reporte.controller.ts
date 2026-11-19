import type { Request, Response } from 'express';
import { reporteService } from '../services/reporte.service.js';
import { IdTransaccionReporteParamSchema, IdUsuarioReporteParamSchema, CrearReporteSchema } from '../validations/reporte.validations.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { BadRequestError, NotFoundError, ConflictError } from '../handlers/errorHandlers.js';

const manejarError = (res: Response, error: any, titulo: string) => {
    if (error instanceof BadRequestError) {
        sendError(res, titulo, [error.message], error.statusCode);
    } else if (error instanceof NotFoundError) {
        sendError(res, 'Recurso no encontrado', [error.message], error.statusCode);
    } else if (error instanceof ConflictError) {
        sendError(res, titulo, [error.message], error.statusCode);
    } else {
        sendError(res, 'Error interno del servidor', [error.message], 500);
    }
};

export const reporteController = {
    reportarTransaccion: async (req: Request, res: Response) => {
        const paramRes = IdTransaccionReporteParamSchema.validate(req.params);
        const bodyRes = CrearReporteSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const resultado = await reporteService.crearDesdeTransaccion(Number(req.user?.id_usuario), paramRes.value.idTransaccion, bodyRes.value);
            sendSuccess(res, resultado, 'Reporte creado con éxito', 201);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo crear el reporte');
        }
    },

    reportarUsuario: async (req: Request, res: Response) => {
        const paramRes = IdUsuarioReporteParamSchema.validate(req.params);
        const bodyRes = CrearReporteSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const resultado = await reporteService.crearDesdePerfil(Number(req.user?.id_usuario), paramRes.value.idUsuario, bodyRes.value);
            sendSuccess(res, resultado, 'Reporte creado con éxito', 201);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo crear el reporte');
        }
    }
};
