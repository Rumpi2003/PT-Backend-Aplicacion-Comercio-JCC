import Joi from 'joi';
import { estadoTransaccion } from '../entities/transaccion.entity.js';

export const IdUsuarioParamSchema = Joi.object({
    idUsuario: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de usuario debe ser un número',
        'number.integer': 'El id de usuario debe ser un número entero',
        'number.positive': 'El id de usuario debe ser positivo',
        'any.required': 'El id de usuario es obligatorio'
    })
});

export const IdTransaccionParamSchema = Joi.object({
    idTransaccion: Joi.number().integer().positive().required().messages({
        'number.base': 'El id de transacción debe ser un número',
        'number.integer': 'El id de transacción debe ser un número entero',
        'number.positive': 'El id de transacción debe ser positivo',
        'any.required': 'El id de transacción es obligatorio'
    })
});

export const ListarTransaccionesQuerySchema = Joi.object({
    vista: Joi.string().valid('activas', 'historial').default('activas').messages({
        'any.only': 'La vista debe ser "activas" o "historial"'
    }),
    estado: Joi.string().valid(...Object.values(estadoTransaccion)).optional().messages({
        'any.only': 'El estado no es válido'
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

const cantidad = Joi.number().integer().min(1).max(999).required().messages({
    'any.required': 'La cantidad es obligatoria',
    'number.base': 'La cantidad debe ser un número',
    'number.integer': 'La cantidad debe ser un número entero',
    'number.min': 'La cantidad debe ser al menos 1',
    'number.max': 'La cantidad no puede exceder los 999'
});

const idCartaOfrecida = Joi.number().integer().positive().required().messages({
    'any.required': 'El id de la carta ofrecida es obligatorio',
    'number.base': 'El id de la carta ofrecida debe ser un número',
    'number.integer': 'El id de la carta ofrecida debe ser un número entero',
    'number.positive': 'El id de la carta ofrecida debe ser positivo'
});

const CartaSolicitadaSchema = Joi.object({
    id_carta_ofrecida: idCartaOfrecida,
    cantidad,
    precio_ofertado: Joi.number().integer().min(0).optional().messages({
        'number.base': 'El precio ofertado debe ser un número',
        'number.integer': 'El precio ofertado debe ser un número entero',
        'number.min': 'El precio ofertado no puede ser negativo'
    })
});

const CartaOfrecidaSchema = Joi.object({
    id_carta_ofrecida: idCartaOfrecida,
    cantidad
});

export const ContraofertaSchema = Joi.object({
    solicitadas: Joi.array().items(CartaSolicitadaSchema).unique('id_carta_ofrecida').default([]).messages({
        'array.unique': 'No puedes repetir cartas solicitadas'
    }),
    ofrecidas: Joi.array().items(CartaSolicitadaSchema).unique('id_carta_ofrecida').default([]).messages({
        'array.unique': 'No puedes repetir cartas ofrecidas'
    })
});

export const CrearTransaccionSchema = Joi.object({
    id_usuario_destino: Joi.number().integer().positive().required().messages({
        'any.required': 'El usuario destino es obligatorio',
        'number.base': 'El usuario destino debe ser un número',
        'number.integer': 'El usuario destino debe ser un número entero',
        'number.positive': 'El usuario destino debe ser positivo'
    }),
    solicitadas: Joi.array().items(CartaSolicitadaSchema).min(1).unique('id_carta_ofrecida').required().messages({
        'any.required': 'Debes solicitar al menos una carta',
        'array.min': 'Debes solicitar al menos una carta',
        'array.unique': 'No puedes repetir cartas solicitadas'
    }),
    ofrecidas: Joi.array().items(CartaOfrecidaSchema).unique('id_carta_ofrecida').default([]).messages({
        'array.unique': 'No puedes repetir cartas ofrecidas'
    })
});
