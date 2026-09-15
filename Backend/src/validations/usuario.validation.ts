import Joi from 'joi';

// Se limita al país de Chile, formato +56XXXXXXXXX
const formatoContacto = /^\+56\d{9}$/;
const complejidadContraseña = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

export const RegistrarUsuarioSchema = Joi.object({
    correo: Joi.string().email().max(255).required().messages({
        'string.email': 'El correo debe tener un formato válido',
        'string.max': 'El correo no debe exceder los 255 caracteres',
        'string.empty': 'El correo es obligatorio',
        'any.required': 'El correo es obligatorio'
    }),
    contraseña: Joi.string().min(8).max(64).pattern(complejidadContraseña).required().messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no debe exceder los 64 caracteres',
        'string.pattern.base': 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial',
        'string.empty': 'La contraseña es obligatoria',
        'any.required': 'La contraseña es obligatoria'
    }),
    nombre_usuario: Joi.string().min(3).max(32).required().messages({
        'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
        'string.max': 'El nombre de usuario no debe exceder los 32 caracteres',
        'string.empty': 'El nombre de usuario es obligatorio',
        'any.required': 'El nombre de usuario es obligatorio'
    }),
    contacto: Joi.string().trim().pattern(formatoContacto).empty('').optional().allow(null).messages({
        'string.pattern.base': 'El contacto debe tener el formato +56XXXXXXXXX'
    }),
    descripcion_perfil: Joi.string().max(255).optional().messages({
        'string.max': 'La descripción del perfil no debe exceder los 255 caracteres'
    }),
    id_comuna: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de la comuna debe ser un número',
        'number.integer': 'El id de la comuna debe ser un número entero',
        'number.positive': 'El id de la comuna debe ser un número positivo',
        'any.required': 'El id de la comuna es obligatorio'
    })
})

export const LoginUsuarioSchema = Joi.object({
    correo: Joi.string().email().max(255).required().messages({
        'string.email': 'El correo debe tener un formato válido',
        'string.max': 'El correo no debe exceder los 255 caracteres',
        'string.empty': 'El correo es obligatorio',
        'any.required': 'El correo es obligatorio'
    }),
    contraseña: Joi.string().max(64).required().messages({
        'string.max': 'La contraseña no debe exceder los 64 caracteres',
        'string.empty': 'La contraseña es obligatoria',
        'any.required': 'La contraseña es obligatoria'
    })
})