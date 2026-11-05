import type { Request, Response } from 'express';
import { mensajeService } from '../services/mensaje.service.js';
import { IdTransaccionParamSchema } from '../validations/transaccion.validations.js';
import { HistorialMensajesQuerySchema, MarcarLeidosBodySchema } from '../validations/mensaje.validations.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { NotFoundError, ConflictError } from '../handlers/errorHandlers.js';

const manejarError = (res: Response, error: any, titulo: string) => {
    if (error instanceof NotFoundError) {
        sendError(res, 'Recurso no encontrado', [error.message], error.statusCode);
    } else if (error instanceof ConflictError) {
        sendError(res, titulo, [error.message], error.statusCode);
    } else {
        sendError(res, 'Error interno del servidor', [error.message], 500);
    }
};

export const mensajeController = {
    listarMensajes: async (req: Request, res: Response) => {
        const paramRes = IdTransaccionParamSchema.validate(req.params);
        const queryRes = HistorialMensajesQuerySchema.validate(req.query);
        const err = paramRes.error ?? queryRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await mensajeService.listarHistorial(id, paramRes.value.idTransaccion, queryRes.value);
            sendSuccess(res, resultado, 'Mensajes obtenidos con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudieron obtener los mensajes');
        }
    },

    marcarLeidos: async (req: Request, res: Response) => {
        const paramRes = IdTransaccionParamSchema.validate(req.params);
        const bodyRes = MarcarLeidosBodySchema.validate(req.body ?? {});
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await mensajeService.marcarLeidos(id, paramRes.value.idTransaccion, bodyRes.value.hasta_id_mensaje);
            sendSuccess(res, resultado, 'Mensajes marcados como leídos', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudieron marcar los mensajes como leídos');
        }
    }
};
