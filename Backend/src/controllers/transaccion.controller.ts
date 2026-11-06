import type { Request, Response } from 'express';
import { transaccionService } from '../services/transaccion.service.js';
import { IdUsuarioParamSchema, IdTransaccionParamSchema, ListarTransaccionesQuerySchema, CrearTransaccionSchema, ContraofertaSchema } from '../validations/transaccion.validations.js';
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

export const transaccionController = {
    listarTransacciones: async (req: Request, res: Response) => {
        const { error, value } = ListarTransaccionesQuerySchema.validate(req.query);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.listarTransacciones(id, value);
            sendSuccess(res, resultado, 'Transacciones obtenidas con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudieron obtener las transacciones');
        }
    },

    obtenerTransaccion: async (req: Request, res: Response) => {
        const { error, value } = IdTransaccionParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.obtenerTransaccion(id, value.idTransaccion);
            sendSuccess(res, resultado, 'Transacción obtenida con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo obtener la transacción');
        }
    },

    contraofertar: async (req: Request, res: Response) => {
        const paramRes = IdTransaccionParamSchema.validate(req.params);
        const bodyRes = ContraofertaSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.contraofertar(id, paramRes.value.idTransaccion, bodyRes.value);
            sendSuccess(res, resultado, 'Contraoferta enviada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo enviar la contraoferta');
        }
    },

    aceptarTransaccion: async (req: Request, res: Response) => {
        const { error, value } = IdTransaccionParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.aceptarTransaccion(id, value.idTransaccion);
            sendSuccess(res, resultado, 'Transacción aceptada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo aceptar la transacción');
        }
    },

    completarTransaccion: async (req: Request, res: Response) => {
        const { error, value } = IdTransaccionParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.confirmarCompletar(id, value.idTransaccion);
            sendSuccess(res, resultado, resultado.estado === 'COMPLETADA' ? 'Transacción completada con éxito' : 'Confirmación registrada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo confirmar la transacción');
        }
    },

    retirarConfirmacion: async (req: Request, res: Response) => {
        const { error, value } = IdTransaccionParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.retirarConfirmacion(id, value.idTransaccion);
            sendSuccess(res, resultado, 'Confirmación retirada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo retirar la confirmación');
        }
    },

    rechazarTransaccion: async (req: Request, res: Response) => {
        const { error, value } = IdTransaccionParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.rechazarTransaccion(id, value.idTransaccion);
            sendSuccess(res, resultado, 'Transacción rechazada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo rechazar la transacción');
        }
    },

    cancelarTransaccion: async (req: Request, res: Response) => {
        const { error, value } = IdTransaccionParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.cancelarTransaccion(id, value.idTransaccion);
            sendSuccess(res, resultado, 'Transacción cancelada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo cancelar la transacción');
        }
    },

    obtenerInventarioContraparte: async (req: Request, res: Response) => {
        const { error, value } = IdUsuarioParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.obtenerInventarioContraparte(id, value.idUsuario);
            sendSuccess(res, resultado, 'Inventario del usuario obtenido con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo obtener el inventario del usuario');
        }
    },

    obtenerMiInventario: async (req: Request, res: Response) => {
        const { error, value } = IdUsuarioParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.obtenerMiInventario(id, value.idUsuario);
            sendSuccess(res, resultado, 'Inventario obtenido con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo obtener el inventario');
        }
    },

    crearTransaccion: async (req: Request, res: Response) => {
        const { error, value } = CrearTransaccionSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await transaccionService.crearTransaccion(id, value);
            sendSuccess(res, resultado, 'Transacción creada con éxito', 201);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo crear la transacción');
        }
    }
};
