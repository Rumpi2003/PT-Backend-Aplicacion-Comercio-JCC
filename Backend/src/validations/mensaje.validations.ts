import Joi from 'joi';

export const LIMITE_CONTENIDO_MENSAJE = 255;

const idTransaccion = Joi.number().integer().positive().required().messages({
    'number.base': 'El id de transacción debe ser un número',
    'number.integer': 'El id de transacción debe ser un número entero',
    'number.positive': 'El id de transacción debe ser positivo',
    'any.required': 'El id de transacción es obligatorio'
});

export const UnirseChatSchema = Joi.object({
    id_transaccion: idTransaccion
});

export const EnviarMensajeSchema = Joi.object({
    id_transaccion: idTransaccion,
    contenido: Joi.string().trim().min(1).max(LIMITE_CONTENIDO_MENSAJE).required().messages({
        'string.base': 'El mensaje debe ser texto',
        'string.empty': 'El mensaje no puede estar vacío',
        'string.min': 'El mensaje no puede estar vacío',
        'string.max': `El mensaje no puede exceder los ${LIMITE_CONTENIDO_MENSAJE} caracteres`,
        'any.required': 'El mensaje es obligatorio'
    })
});

const hastaIdMensaje = Joi.number().integer().positive().optional().messages({
    'number.base': 'El id del mensaje debe ser un número',
    'number.integer': 'El id del mensaje debe ser un número entero',
    'number.positive': 'El id del mensaje debe ser positivo'
});

// Sin `hasta_id_mensaje` se marcan como leídos todos los mensajes recibidos
export const MarcarLeidosSchema = Joi.object({
    id_transaccion: idTransaccion,
    hasta_id_mensaje: hastaIdMensaje
});

export const MarcarLeidosBodySchema = Joi.object({
    hasta_id_mensaje: hastaIdMensaje
});

export const HistorialMensajesQuerySchema = Joi.object({
    antes: Joi.number().integer().positive().optional().messages({
        'number.base': 'El cursor "antes" debe ser un número',
        'number.integer': 'El cursor "antes" debe ser un número entero',
        'number.positive': 'El cursor "antes" debe ser positivo'
    }),
    despues: Joi.number().integer().positive().optional().messages({
        'number.base': 'El cursor "despues" debe ser un número',
        'number.integer': 'El cursor "despues" debe ser un número entero',
        'number.positive': 'El cursor "despues" debe ser positivo'
    }),
    limite: Joi.number().integer().min(1).max(100).default(50).messages({
        'number.base': 'El límite debe ser un número',
        'number.integer': 'El límite debe ser un número entero',
        'number.min': 'El límite debe ser al menos 1',
        'number.max': 'El límite no puede exceder 100'
    })
}).oxor('antes', 'despues').messages({
    'object.oxor': 'Usa solo uno de los cursores "antes" o "despues"'
});
