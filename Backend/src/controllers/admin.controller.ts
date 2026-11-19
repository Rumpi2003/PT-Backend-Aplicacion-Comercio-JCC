import type { Request, Response } from 'express';
import { reporteService } from '../services/reporte.service.js';
import { IdReporteParamSchema, IdUsuarioAdminParamSchema, ListarReportesQuerySchema, CambiarEstadoReporteSchema } from '../validations/reporte.validations.js';
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

export const adminController = {
    listarReportes: async (req: Request, res: Response) => {
        const { error, value } = ListarReportesQuerySchema.validate(req.query);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const resultado = await reporteService.listar(value);
            sendSuccess(res, resultado, 'Reportes obtenidos con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudieron obtener los reportes');
        }
    },

    detalleReporte: async (req: Request, res: Response) => {
        const { error, value } = IdReporteParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const resultado = await reporteService.detalle(value.idReporte);
            sendSuccess(res, resultado, 'Reporte obtenido con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo obtener el reporte');
        }
    },

    cambiarEstadoReporte: async (req: Request, res: Response) => {
        const paramRes = IdReporteParamSchema.validate(req.params);
        const bodyRes = CambiarEstadoReporteSchema.validate(req.body);
        const err = paramRes.error ?? bodyRes.error;
        if (err) {
            sendError(res, 'Error de validación', [err.message], 400);
            return;
        }
        try {
            const resultado = await reporteService.cambiarEstado(paramRes.value.idReporte, bodyRes.value.estado, bodyRes.value.resolucion ?? null);
            sendSuccess(res, resultado, 'Estado del reporte actualizado con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo cambiar el estado del reporte');
        }
    },

    levantarSuspension: async (req: Request, res: Response) => {
        const { error, value } = IdUsuarioAdminParamSchema.validate(req.params);
        if (error) {
            sendError(res, 'Error de validación', [error.message], 400);
            return;
        }
        try {
            const resultado = await reporteService.levantarSuspension(value.idUsuario);
            sendSuccess(res, resultado, 'Suspensión levantada con éxito', 200);
        } catch (error: any) {
            manejarError(res, error, 'No se pudo levantar la suspensión');
        }
    }
};
