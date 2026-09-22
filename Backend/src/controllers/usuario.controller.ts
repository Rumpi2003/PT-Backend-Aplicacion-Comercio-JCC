import type { Request, Response } from "express";
import { usuarioService } from "../services/usuario.service.js";
import { sendSuccess, sendError } from '../handlers/responseHandlers.js'

export const usuarioController = {
    getPerfilPersonal: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const perfil = await usuarioService.getPerfilPersonal(id);
            sendSuccess(res, perfil);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    }
}
