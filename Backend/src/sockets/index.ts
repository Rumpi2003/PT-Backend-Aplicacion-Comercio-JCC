import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { mensajeService } from '../services/mensaje.service.js';
import { notificacionService } from '../services/notificacion.service.js';
import { UnirseChatSchema, EnviarMensajeSchema, MarcarLeidosSchema } from '../validations/mensaje.validations.js';
import { BadRequestError, ConflictError, NotFoundError } from '../handlers/errorHandlers.js';
import { registrarServidorChat, usuarioEnSalaChat } from './chat.emitter.js';
import { salaTransaccion, salaUsuario, type Ack, type ChatServer, type ClientToServerEvents, type ServerToClientEvents, type SocketData } from './chat.types.js';

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const MAX_MENSAJES_POR_VENTANA = 10;
const VENTANA_MS = 10_000;

const mensajeDeError = (error: unknown): string => {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ConflictError) {
        return error.message;
    }
    console.error('Error en el chat:', error);
    return 'Error interno del servidor';
};

/** Ejecuta el handler y responde por el ack; una excepción nunca debe escapar de un handler asíncrono. */
const manejar = <T>(ack: Ack<T> | undefined, accion: () => Promise<T | void>) => {
    const responder = typeof ack === 'function' ? ack : () => {};
    accion().then(
        (data) => (responder as Ack<any>)(data === undefined ? { ok: true } : { ok: true, data }),
        (error) => responder({ ok: false, mensaje: mensajeDeError(error) })
    );
};

const validar = <T>(schema: { validate: (v: unknown) => { error?: { message: string } | undefined; value: T } }, payload: unknown): T => {
    const { error, value } = schema.validate(payload);
    if (error) throw new BadRequestError(error.message);
    return value;
};

const autenticar = (socket: ChatSocket, next: (error?: Error) => void): void => {
    const token = socket.handshake.auth?.['token'];
    if (typeof token !== 'string' || !token.trim()) {
        return next(new Error('Token no proporcionado'));
    }
    const secreto = process.env.JWT_SECRET;
    if (!secreto) {
        return next(new Error('JWT_SECRET no está definida'));
    }
    try {
        const decoded = jwt.verify(token.replace(/^Bearer\s+/i, '').trim(), secreto);
        if (typeof decoded === 'string' || typeof decoded.id_usuario !== 'number' || typeof decoded.correo !== 'string') {
            return next(new Error('Token inválido'));
        }
        socket.data.user = { id_usuario: decoded.id_usuario, correo: decoded.correo };
        next();
    } catch {
        next(new Error('Token inválido o expirado'));
    }
};

export function initSockets(io: ChatServer): void {
    registrarServidorChat(io);
    io.use(autenticar);

    io.on('connection', (socket) => {
        const { id_usuario } = socket.data.user;
        // Sala personal: permite avisar a todas las sesiones del usuario (varias pestañas o dispositivos)
        void socket.join(salaUsuario(id_usuario));
        console.log(`[socket] conectado usuario=${id_usuario} socket=${socket.id}`);
        socket.on('disconnect', (motivo) => console.log(`[socket] desconectado usuario=${id_usuario} socket=${socket.id} motivo=${motivo}`));

        const enviosRecientes: number[] = [];

        socket.on('chat:unirse', (payload, ack) => manejar(ack, async () => {
            const { id_transaccion } = validar<{ id_transaccion: number }>(UnirseChatSchema, payload);
            await mensajeService.validarAccesoChat(id_usuario, id_transaccion);
            await socket.join(salaTransaccion(id_transaccion));
        }));

        socket.on('chat:salir', (payload, ack) => manejar(ack, async () => {
            const { id_transaccion } = validar<{ id_transaccion: number }>(UnirseChatSchema, payload);
            await socket.leave(salaTransaccion(id_transaccion));
        }));

        socket.on('chat:enviar', (payload, ack) => manejar(ack, async () => {
            const ahora = Date.now();
            while (enviosRecientes.length && ahora - enviosRecientes[0]! > VENTANA_MS) enviosRecientes.shift();
            if (enviosRecientes.length >= MAX_MENSAJES_POR_VENTANA) {
                throw new ConflictError('Estás enviando mensajes demasiado rápido');
            }
            enviosRecientes.push(ahora);

            const { id_transaccion, contenido } = validar<{ id_transaccion: number; contenido: string }>(EnviarMensajeSchema, payload);
            const { mensaje, idDestinatario } = await mensajeService.enviar(id_usuario, id_transaccion, contenido);
            io.to(salaTransaccion(id_transaccion)).emit('chat:mensaje', mensaje);

            // Si el destinatario tiene el chat abierto ya recibió el mensaje en vivo; si no, se le avisa por push
            usuarioEnSalaChat(idDestinatario, id_transaccion)
                .then(enSala => {
                    if (!enSala) notificacionService.notificar([idDestinatario], 'MENSAJE', id_transaccion, id_usuario);
                })
                .catch(error => console.error('Error al decidir la notificación del mensaje:', error));
            return mensaje;
        }));

        socket.on('chat:leido', (payload, ack) => manejar(ack, async () => {
            const { id_transaccion, hasta_id_mensaje } = validar<{ id_transaccion: number; hasta_id_mensaje?: number }>(MarcarLeidosSchema, payload);
            return mensajeService.marcarLeidos(id_usuario, id_transaccion, hasta_id_mensaje);
        }));
    });
}
