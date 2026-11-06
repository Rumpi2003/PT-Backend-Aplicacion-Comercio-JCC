import { salaTransaccion, salaUsuario, type CambioEstadoTransaccion, type ChatServer } from './chat.types.js';
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

/** Avisa a los participantes (en todas sus sesiones, estén o no en el chat) que cambió el estado de la transacción. */
export const emitirCambioTransaccion = (idsUsuario: number[], payload: CambioEstadoTransaccion): void => {
    if (!io) return;
    const salas = [...new Set(idsUsuario)].map(salaUsuario);
    io.to(salas).emit('transaccion:estado', payload);

    // El evento no se reenvía a quien esté desconectado; el log ayuda a distinguir ese caso de un fallo del cliente
    io.in(salas).fetchSockets()
        .then(sockets => console.log(
            `[socket] transaccion:estado cambio=${payload.cambio} tx=${payload.id_transaccion} -> usuarios [${idsUsuario.join(', ')}], sockets conectados: ${sockets.length}`))
        .catch(() => {});
};

/** Indica si algún socket del usuario está en la sala del chat; si lo está, el push de un mensaje nuevo sobra. */
export const usuarioEnSalaChat = async (idUsuario: number, idTransaccion: number): Promise<boolean> => {
    if (!io) return false;
    const sockets = await io.in(salaTransaccion(idTransaccion)).fetchSockets();
    return sockets.some(s => s.data.user.id_usuario === idUsuario);
};
