import Joi from 'joi';
import { Motivo, estadoReporte } from '../entities/reporte.entity.js';

const idParam = (nombre: string, etiqueta: string) =>
    Joi.object({
        [nombre]: Joi.number().integer().positive().required().messages({
            'number.base': `El id de ${etiqueta} debe ser un número`,
            'number.integer': `El id de ${etiqueta} debe ser un número entero`,
            'number.positive': `El id de ${etiqueta} debe ser positivo`,
            'any.required': `El id de ${etiqueta} es obligatorio`
        })
    });

export const IdTransaccionReporteParamSchema = idParam('idTransaccion', 'transacción');
export const IdUsuarioReporteParamSchema = idParam('idUsuario', 'usuario');
export const IdReporteParamSchema = idParam('idReporte', 'reporte');
export const IdUsuarioAdminParamSchema = idParam('idUsuario', 'usuario');

export const CrearReporteSchema = Joi.object({
    motivo: Joi.string().valid(...Object.values(Motivo)).required().messages({
        'any.only': 'El motivo del reporte no es válido',
        'any.required': 'El motivo del reporte es obligatorio'
    }),
    descripcion_reporte: Joi.string().trim().min(10).max(255).required().messages({
        'string.base': 'La descripción debe ser texto',
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede exceder los 255 caracteres',
        'any.required': 'La descripción es obligatoria'
    })
});

export const ListarReportesQuerySchema = Joi.object({
    estado: Joi.string().valid(...Object.values(estadoReporte)).optional().messages({
        'any.only': 'El estado indicado no es válido'
    }),
    limite: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': 'El límite debe ser un número',
        'number.integer': 'El límite debe ser un número entero',
        'number.min': 'El límite debe ser al menos 1',
        'number.max': 'El límite no puede exceder 100'
    }),
    offset: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'El offset debe ser un número',
        'number.integer': 'El offset debe ser un número entero',
        'number.min': 'El offset no puede ser negativo'
    })
});

export const CambiarEstadoReporteSchema = Joi.object({
    estado: Joi.string()
        .valid(estadoReporte.DESESTIMADO, estadoReporte.ARCHIVADO, estadoReporte.SANCIONADO)
        .required()
        .messages({
            'any.only': 'El nuevo estado debe ser DESESTIMADO, ARCHIVADO o SANCIONADO',
            'any.required': 'El nuevo estado es obligatorio'
        }),
    resolucion: Joi.string().trim().min(10).max(255)
        .when('estado', {
            is: estadoReporte.SANCIONADO,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.base': 'La resolución debe ser texto',
            'string.min': 'La resolución debe tener al menos 10 caracteres',
            'string.max': 'La resolución no puede exceder los 255 caracteres',
            'any.required': 'La resolución es obligatoria para sancionar una cuenta'
        })
});
