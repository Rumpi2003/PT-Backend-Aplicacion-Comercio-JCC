import type { Request, Response } from "express";
import { usuarioService } from "../services/usuario.service.js";
import { sendSuccess, sendError } from '../handlers/responseHandlers.js'
import { UpdateDescripcionSchema, UpdateComunaSchema } from '../validations/usuario.validation.js';

export const usuarioController = {
    getPerfilPersonal: async (req: Request, res: Response) => {
        try {
            const id = Number(req.user?.id_usuario);
            const perfil = await usuarioService.getPerfilPersonal(id);
            sendSuccess(res, perfil);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    },

    updateDescripcion: async (req: Request, res: Response) => {
        const { error, value } = UpdateDescripcionSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const { descripcion_perfil } = value;
            const descripcionActualizada = await usuarioService.updateDescripcion(id, descripcion_perfil);
            sendSuccess(res, descripcionActualizada, 'Descripción actualizada correctamente', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    },

    updateComuna: async (req: Request, res: Response) => {
        const { error, value } = UpdateComunaSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const { id_comuna } = value;
            const comunaActualizada = await usuarioService.updateComuna(id, id_comuna);
            sendSuccess(res, comunaActualizada, 'Comuna actualizada correctamente', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    }
}
