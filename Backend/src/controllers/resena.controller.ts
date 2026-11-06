import type { Request, Response } from 'express';
import { resenaService } from '../services/resena.service.js';
import { IdUsuarioResenaParamSchema, GuardarResenaSchema, ListarResenasQuerySchema } from '../validations/resena.validations.js';
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

export const resenaController = {
    guardar: async (req: Request, res: Response) => {
        const paramRes = IdUsuarioResenaParamSchema.validate(req.params);
        const bodyRes = GuardarResenaSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await resenaService.guardar(id, paramRes.value.idUsuario, bodyRes.value);
            sendSuccess(res, resultado, resultado.editada ? 'Reseña actualizada con éxito' : 'Reseña creada con éxito', resultado.editada ? 200 : 201);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo guardar la reseña');
        }
    },

    obtenerMia: async (req: Request, res: Response) => {
        const { error, value } = IdUsuarioResenaParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await resenaService.obtenerMia(id, value.idUsuario);
            sendSuccess(res, resultado, 'Reseña obtenida con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo obtener la reseña');
        }
    },

    listarRecibidas: async (req: Request, res: Response) => {
        const paramRes = IdUsuarioResenaParamSchema.validate(req.params);
        const queryRes = ListarResenasQuerySchema.validate(req.query);
        const err = paramRes.error ?? queryRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const resultado = await resenaService.listarRecibidas(paramRes.value.idUsuario, queryRes.value.limite, queryRes.value.offset);
            sendSuccess(res, resultado, 'Reseñas obtenidas con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudieron obtener las reseñas');
        }
    }
};
