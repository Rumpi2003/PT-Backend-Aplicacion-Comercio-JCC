import Joi from 'joi';

export const DispositivoSchema = Joi.object({
    token: Joi.string().trim().min(1).max(512).required().messages({
        'string.base': 'El token del dispositivo debe ser texto',
        'string.empty': 'El token del dispositivo es obligatorio',
        'string.max': 'El token del dispositivo no puede exceder los 512 caracteres',
        'any.required': 'El token del dispositivo es obligatorio'
    })
});
