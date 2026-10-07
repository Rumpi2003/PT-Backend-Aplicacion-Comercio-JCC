import Joi from 'joi';

export const BuscarCartaSchema = Joi.object({
    tcg_id: Joi.string().trim().min(1).max(255).optional().messages({
        'string.empty': 'El ID del TCG no puede estar vacío'
    }),
    set_id: Joi.string().trim().min(1).max(255).optional().messages({
        'string.empty': 'El ID del set no puede estar vacío'
    }),
    nombre: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'El nombre de la carta es obligatorio',
        'any.required': 'El nombre de la carta es obligatorio'
    }),
    sortBy: Joi.string().trim().min(1).max(255).optional().valid('name').messages({
        'string.empty': 'El criterio de orden no puede estar vacío',
        'any.only': 'El criterio de orden debe ser "name"'
    }),
    sortOrder: Joi.string().trim().min(1).max(255).optional().valid('asc', 'desc').messages({
        'string.empty': 'El orden de clasificación no puede estar vacío',
        'any.only': 'El orden de clasificación debe ser "asc" o "desc"'
    }),
    pagina: Joi.number().integer().min(1).default(1),
    limite: Joi.number().integer().min(1).max(50).default(10)
});

export const ListarSetsSchema = Joi.object({
    tcg: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'El TCG es obligatorio',
        'any.required': 'El TCG es obligatorio'
    }),
    sortBy: Joi.string().trim().min(1).max(255).optional().valid('name', 'release_date').messages({
        'string.empty': 'El criterio de orden no puede estar vacío',
        'any.only': 'El criterio de orden debe ser "name" o "release_date"'
    }),
    sortOrder: Joi.string().trim().min(1).max(255).optional().valid('asc', 'desc').messages({
        'string.empty': 'El orden de clasificación no puede estar vacío',
        'any.only': 'El orden de clasificación debe ser "asc" o "desc"'
    })
});