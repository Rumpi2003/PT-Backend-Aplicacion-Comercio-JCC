import Joi from 'joi';

export const IdUsuarioResenaParamSchema = Joi.object({
    idUsuario: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de usuario debe ser un número',
        'number.integer': 'El id de usuario debe ser un número entero',
        'number.positive': 'El id de usuario debe ser positivo',
        'any.required': 'El id de usuario es obligatorio'
    })
});

export const GuardarResenaSchema = Joi.object({
    puntuacion: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'La puntuación debe ser un número',
        'number.integer': 'La puntuación debe ser un número entero',
        'number.min': 'La puntuación debe estar entre 1 y 5',
        'number.max': 'La puntuación debe estar entre 1 y 5',
        'any.required': 'La puntuación es obligatoria'
    }),
    cuerpo: Joi.string().trim().max(255).allow('').optional().messages({
        'string.base': 'La reseña debe ser texto',
        'string.max': 'La reseña no puede exceder los 255 caracteres'
    })
});

export const ListarResenasQuerySchema = Joi.object({
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
