import Joi from 'joi';

export const BuscarCartaSchema = Joi.object({
    nombre: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'El nombre de la carta es obligatorio',
        'any.required': 'El nombre de la carta es obligatorio'
    }),
    pagina: Joi.number().integer().min(1).default(1),
    limite: Joi.number().integer().min(1).max(50).default(10)
});