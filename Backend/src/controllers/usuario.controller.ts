import type { Request, Response } from "express";
import { usuarioService } from "../services/usuario.service.js";
import { sendSuccess, sendError } from '../handlers/responseHandlers.js'
import { UpdateDescripcionSchema, UpdateComunaSchema, UpdateRadioGeoSchema, UpdateVisibilidadPerfilSchema, UpdateModoGeoSchema, UpdateUbicacionSchema } from '../validations/usuario.validation.js';
import { NotFoundError, ConflictError } from '../handlers/errorHandlers.js';


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
    },

    updateRadioGeo: async (req: Request, res: Response) => {
        const { error, value } = UpdateRadioGeoSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const { radio_geo } = value;
            const radioGeoActualizado = await usuarioService.updateRadioGeo(id, radio_geo);
            sendSuccess(res, radioGeoActualizado, 'Radio geográfico actualizado correctamente', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    },

    updateVisibilidadPerfil: async (req: Request, res: Response) => {
        const { error, value } = UpdateVisibilidadPerfilSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const { visibilidad_perfil } = value;
            const visibilidadActualizada = await usuarioService.updateVisibilidadPerfil(id, visibilidad_perfil);
            sendSuccess(res, visibilidadActualizada, 'Visibilidad del perfil actualizada correctamente', 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);        
        }
    },

    updateModoGeo: async (req: Request, res: Response) => {
        const { error, value } = UpdateModoGeoSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const { modo_geo_activado } = value;
            const modoGeoActualizado = await usuarioService.updateModoGeo(id, modo_geo_activado);
            sendSuccess(res, modoGeoActualizado, `Modo geográfico ${modo_geo_activado ? 'activado' : 'desactivado'} correctamente`, 200);
        } catch (error: any) {
            sendError(res, 'Error interno del servidor', [error.message], 500);
        }
    },

    getModoGeo: async (req: Request, res: Response) => {
        try {
            const id = Number(req.user?.id_usuario);
            const modoGeo = await usuarioService.getModoGeo(id);
            sendSuccess(res, modoGeo);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Usuario no encontrado', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    },

    updateUbicacion: async (req: Request, res: Response) => {
        const { error, value } = UpdateUbicacionSchema.validate(req.body);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const id = Number(req.user?.id_usuario);
            const { latitud, longitud } = value;
            const ubicacion = await usuarioService.updateUbicacion(id, latitud, longitud);
            sendSuccess(res, ubicacion, 'Ubicación actualizada correctamente', 200);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                sendError(res, 'Usuario no encontrado', [error.message], error.statusCode);
            } else if (error instanceof ConflictError) {
                sendError(res, 'No se puede actualizar la ubicación', [error.message], error.statusCode);
            } else {
                sendError(res, 'Error interno del servidor', [error.message], 500);
            }
        }
    }


}
