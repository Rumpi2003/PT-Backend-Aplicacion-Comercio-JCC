import Joi from 'joi';

export const ObtenerEmparejamientosQuerySchema = Joi.object({
    usarGeolocalizacion: Joi.boolean().optional().messages({
        'boolean.base': 'usarGeolocalizacion debe ser true o false'
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
