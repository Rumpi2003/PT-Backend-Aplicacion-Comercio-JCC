import type { Request, Response } from 'express';
import { inventarioService } from '../services/inventario.service.js';
import { AgregarCartaOfrecidaSchema, AgregarCartaDeseadaSchema } from '../validations/inventario.validations.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';
import { ExternalApiError } from '../handlers/errorHandlers.js';


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
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    obtenerInventario: async (req: Request, res: Response) => {
        try {
            const id = Number(req.user?.id_usuario);
            const inventario = await inventarioService.obtenerInventario(id);
            sendSuccess(res, inventario, 'Inventario obtenido con éxito', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);
        }
    },

    obtenerListaDeseos: async (req: Request, res: Response) => {
        try {
            const id = Number(req.user?.id_usuario);
            const lista = await inventarioService.obtenerListaDeseos(id);
            sendSuccess(res, lista, 'Lista de deseos obtenida con éxito', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);
        }
    }
}
