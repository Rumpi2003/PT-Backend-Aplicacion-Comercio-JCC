import { Estado } from '../entities/cartaOfrecida.entity.js';
import { EstadoMin } from '../entities/cartaDeseada.entity.js';
import Joi from 'joi';

enum Idioma {
    INGLES = 'Inglés',
    JAPONES = 'Japonés',
    ESPAÑOL = 'Español',
    FRANCES = 'Francés',
    ALEMAN = 'Alemán',
    ITALIANO = 'Italiano',
    PORTUGUES = 'Portugués',
    COREANO = 'Coreano',
    CHINO = 'Chino'
}

export const AgregarCartaOfrecidaSchema = Joi.object({
    id_tipo_carta: Joi.number().integer().positive().required().messages({
        'any.required': 'El id de la carta es obligatorio'
    }),
    estado: Joi.string().valid(...Object.values(Estado)).required().messages({
        'any.only': 'El estado no es válido',
        'any.required': 'El estado es obligatorio'
    }),
    idioma: Joi.string().valid(...Object.values(Idioma)).required().messages({
        'any.required': 'El idioma es obligatorio',
        'string.min': 'El idioma debe tener al menos 1 caracter',
        'string.max': 'El idioma no puede exceder los 255 caracteres'
    }),
    precio: Joi.number().integer().min(0).required().messages({
        'any.required': 'El precio es obligatorio',
        'number.min': 'El precio no puede ser negativo'
    }),
    cantidad: Joi.number().integer().min(1).max(999).default(1).required().messages({
        'any.required': 'La cantidad es obligatoria',
        'number.min': 'La cantidad debe ser al menos 1',
        'number.max': 'La cantidad no puede exceder los 999'
    })
});

export const AgregarCartaDeseadaSchema = Joi.object({
    id_tipo_carta: Joi.number().integer().positive().required().messages({
        'any.required': 'El id de la carta es obligatorio'
    }),
    estado_minimo: Joi.string().valid(...Object.values(EstadoMin)).required().messages({
        'any.only': 'El estado mínimo no es válido',
        'any.required': 'El estado mínimo es obligatorio'
    }),
    idioma: Joi.string().valid(...Object.values(Idioma)).required().messages({
        'any.required': 'El idioma es obligatorio',
        'any.only': 'El idioma no es válido'
    }),
    cantidad: Joi.number().integer().min(1).max(999).default(1).messages({
        'number.min': 'La cantidad debe ser al menos 1',
        'number.max': 'La cantidad no puede exceder los 999'
    })
});