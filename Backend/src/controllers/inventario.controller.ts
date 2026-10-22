import type { Request, Response } from 'express';
import { inventarioService, type SortBy, type SortOrder } from '../services/inventario.service.js';
import { AgregarCartaOfrecidaSchema,
     AgregarCartaDeseadaSchema,
     ObtenerInventarioQuerySchema,
     ObtenerListaDeseosQuerySchema,
     ModificarCartaOfrecidaSchema,
     IdCartaOfrecidaSchema,
     IdCartaDeseadaSchema,
     ModificarCartaDeseadaSchema } from '../validations/inventario.validations.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { ExternalApiError, NotFoundError, ConflictError } from '../handlers/errorHandlers.js';


export const inventarioController = {
    agregarCartaOfrecida: async (req: Request, res: Response) => {
        const { error, value: datos } = AgregarCartaOfrecidaSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await inventarioService.agregarCartaOfrecida(id, datos);
            sendSuccess(res, resultado, 'Carta ofrecida agregada con éxito', 200);
        } catch (error: any) {
            if (error instanceof ExternalApiError) {
                sendError(res, 'Error en la API externa', [error.message], error.statusCode);
            } else if(error instanceof ConflictError) {
                sendError(res, 'Conflicto al agregar carta ofrecida', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },
    
    agregarCartaDeseada: async (req: Request, res: Response) => {
        const { error, value: datos } = AgregarCartaDeseadaSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await inventarioService.agregarCartaDeseada(id, datos);
            sendSuccess(res, resultado, 'Carta deseada agregada con éxito', 200);
        } catch (error: any) {
            if (error instanceof ExternalApiError) {
                sendError(res, 'Error en la API externa', [error.message], error.statusCode);
            } else if(error instanceof ConflictError) {
                sendError(res, 'Conflicto al agregar carta deseada', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    obtenerInventario: async (req: Request, res: Response) => {
        const { error, value } = ObtenerInventarioQuerySchema.validate(req.query);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const inventario = await inventarioService.obtenerInventario(id, value.sortBy as SortBy, value.sortOrder as SortOrder);
            sendSuccess(res, inventario, 'Inventario obtenido con éxito', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);
        }
    },

    obtenerListaDeseos: async (req: Request, res: Response) => {
        const { error, value } = ObtenerListaDeseosQuerySchema.validate(req.query);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const lista = await inventarioService.obtenerListaDeseos(id, value.sortBy as Exclude<SortBy, 'precio'>, value.sortOrder as SortOrder);
            sendSuccess(res, lista, 'Lista de deseos obtenida con éxito', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);
        }
    },

    modificarCartaOfrecida: async (req: Request, res: Response) => {
        const paramRes = IdCartaOfrecidaSchema.validate(req.params.id_carta_ofrecida);
        const bodyRes = ModificarCartaOfrecidaSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const id_carta_ofrecida = paramRes.value;
            const datos = bodyRes.value;
            const resultado = await inventarioService.modificarCartaOfrecida(id, id_carta_ofrecida, datos);
            sendSuccess(res, resultado, 'Carta ofrecida modificada con éxito', 200);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Carta ofrecida no encontrada', [error.message], error.statusCode);
            } else if (error instanceof ConflictError) {
                sendError(res, 'Conflicto al modificar la carta ofrecida', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    eliminarCartaOfrecida: async (req: Request, res: Response) => {
        const { error, value: id_carta_ofrecida } = IdCartaOfrecidaSchema.validate(req.params.id_carta_ofrecida);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            await inventarioService.eliminarCartaOfrecida(id, id_carta_ofrecida);
            sendSuccess(res, null, 'Carta ofrecida eliminada con éxito', 200);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Carta ofrecida no encontrada', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    modificarCartaDeseada: async (req: Request, res: Response) => {
        const paramRes = IdCartaDeseadaSchema.validate(req.params.id_carta_deseada);
        const bodyRes = ModificarCartaDeseadaSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const resultado = await inventarioService.modificarCartaDeseada(id, paramRes.value, bodyRes.value);
            sendSuccess(res, resultado, 'Carta deseada modificada con éxito', 200);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Carta deseada no encontrada', [error.message], error.statusCode);
            } else if (error instanceof ConflictError) {
                sendError(res, 'Conflicto al modificar la carta deseada', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    eliminarCartaDeseada: async (req: Request, res: Response) => {
        const { error, value: id_carta_deseada } = IdCartaDeseadaSchema.validate(req.params.id_carta_deseada);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            await inventarioService.eliminarCartaDeseada(id, id_carta_deseada);
            sendSuccess(res, null, 'Carta deseada eliminada con éxito', 200);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Carta deseada no encontrada', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },
}
