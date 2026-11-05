import type { Server } from 'socket.io';
import type { MensajeChat, MensajesLeidos } from '../services/mensaje.service.js';

export type RespuestaAck<T = undefined> =
    | ({ ok: true } & (T extends undefined ? {} : { data: T }))
    | { ok: false; mensaje: string };

export type Ack<T = undefined> = (respuesta: RespuestaAck<T>) => void;

// Los payloads llegan como `unknown` porque se validan con Joi antes de usarlos.
export interface ClientToServerEvents {
    'chat:unirse': (payload: unknown, ack?: Ack) => void;
    'chat:salir': (payload: unknown, ack?: Ack) => void;
    'chat:enviar': (payload: unknown, ack?: Ack<MensajeChat>) => void;
    'chat:leido': (payload: unknown, ack?: Ack<{ cantidad: number }>) => void;
}

export interface ServerToClientEvents {
    'chat:mensaje': (mensaje: MensajeChat) => void;
    'chat:leido': (payload: MensajesLeidos) => void;
    'chat:cerrado': (payload: { id_transaccion: number }) => void;
}

export interface SocketData {
    user: { id_usuario: number; correo: string };
}

export type ChatServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export const salaTransaccion = (idTransaccion: number): string => `transaccion:${idTransaccion}`;
export const salaUsuario = (idUsuario: number): string => `usuario:${idUsuario}`;
