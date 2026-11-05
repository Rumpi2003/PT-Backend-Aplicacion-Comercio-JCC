import type { Request, Response } from 'express';
import { notificacionService } from '../services/notificacion.service.js';
import { DispositivoSchema } from '../validations/dispositivo.validations.js';
import { sendSuccess, sendError } from '../handlers/responseHandlers.js';

export const dispositivoController = {
    registrar: async (req: Request, res: Response) => {
        const { error, value } = DispositivoSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            await notificacionService.registrarDispositivo(Number(req.user?.id_usuario), value.token);
            sendSuccess(res, null, 'Dispositivo registrado con éxito', 200);
        } catch (error: any) {
            sendError(res, 'No se pudo registrar el dispositivo', [error.message], 500);
        }
    },

    eliminar: async (req: Request, res: Response) => {
        const { error, value } = DispositivoSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            await notificacionService.eliminarDispositivo(Number(req.user?.id_usuario), value.token);
            sendSuccess(res, null, 'Dispositivo eliminado con éxito', 200);
        } catch (error: any) {
            sendError(res, 'No se pudo eliminar el dispositivo', [error.message], 500);
        }
    }
};
