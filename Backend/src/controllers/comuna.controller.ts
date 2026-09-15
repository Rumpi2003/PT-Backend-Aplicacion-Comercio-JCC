import type { Request, Response } from "express";
import { comunaService } from "../services/comuna.service.js";
import { sendSuccess, sendError } from '../handlers/responseHandlers.js'

export const comunaController = {
    getAll: async (req: Request, res: Response) => {
        try {
            const comunas = await comunaService.getAll();
            sendSuccess(res, comunas);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    }
};