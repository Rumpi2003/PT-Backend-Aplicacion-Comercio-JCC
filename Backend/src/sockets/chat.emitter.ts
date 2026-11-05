import { salaTransaccion, type ChatServer } from './chat.types.js';
import type { MensajesLeidos } from '../services/mensaje.service.js';

let io: ChatServer | null = null;

export const registrarServidorChat = (servidor: ChatServer): void => {
    io = servidor;
};

/** Avisa a los participantes conectados que el chat se cerró (la transacción dejó de estar PENDIENTE) y los saca de la sala. */
export const emitirChatCerrado = (idTransaccion: number): void => {
    if (!io) return;
    const sala = salaTransaccion(idTransaccion);
    io.to(sala).emit('chat:cerrado', { id_transaccion: idTransaccion });
    io.in(sala).socketsLeave(sala);
};

/** Avisa a la sala que `id_lector` leyó los mensajes hasta `hasta_id_mensaje`. */
export const emitirMensajesLeidos = (payload: MensajesLeidos): void => {
    io?.to(salaTransaccion(payload.id_transaccion)).emit('chat:leido', payload);
};

/** Indica si algún socket del usuario está en la sala del chat; si lo está, el push de un mensaje nuevo sobra. */
export const usuarioEnSalaChat = async (idUsuario: number, idTransaccion: number): Promise<boolean> => {
    if (!io) return false;
    const sockets = await io.in(salaTransaccion(idTransaccion)).fetchSockets();
    return sockets.some(s => s.data.user.id_usuario === idUsuario);
};
