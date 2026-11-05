import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/db.config.js';
import { estadoTransaccion } from '../entities/transaccion.entity.js';
import { ConflictError, NotFoundError } from '../handlers/errorHandlers.js';
import { emitirMensajesLeidos } from '../sockets/chat.emitter.js';
import { filasDe } from '../utils/db.js';

export interface MensajeChat {
    id_mensaje: number;
    id_transaccion: number;
    id_emisor: number;
    contenido: string;
    leido: boolean;
    fecha_envio: string;
}

export interface MensajesLeidos {
    id_transaccion: number;
    id_lector: number;
    hasta_id_mensaje: number;
}

export interface OpcionesHistorial {
    antes?: number | undefined;
    despues?: number | undefined;
    limite?: number | undefined;
}

const proyectarMensaje = (idTransaccion: number, fila: any): MensajeChat => ({
    id_mensaje: Number(fila.id_mensaje),
    id_transaccion: idTransaccion,
    id_emisor: Number(fila.id_emisor),
    contenido: String(fila.contenido),
    leido: Boolean(fila.leido),
    fecha_envio: new Date(fila.fecha_envio).toISOString()
});

/**
 * Lee la transacción exigiendo que `idUsuario` sea participante. Con `bloqueoCompartido` el estado no puede cambiar
 * (p. ej. cancelarse) hasta que termine la transacción de base de datos que la consulta.
 */
async function leerParticipacion(manager: EntityManager, idUsuario: number, idTransaccion: number, bloqueoCompartido = false) {
    const [fila]: any[] = await manager.query(
        `SELECT id_usuario_1, id_usuario_2, estado FROM transaccion
         WHERE id_transaccion = $1${bloqueoCompartido ? ' FOR SHARE' : ''}`,
        [idTransaccion]
    );
    const idUsuario1 = Number(fila?.id_usuario_1);
    const idUsuario2 = Number(fila?.id_usuario_2);
    if (!fila || (idUsuario1 !== idUsuario && idUsuario2 !== idUsuario)) {
        throw new NotFoundError('Transacción no encontrada');
    }
    return {
        estado: fila.estado as estadoTransaccion,
        idOtro: idUsuario1 === idUsuario ? idUsuario2 : idUsuario1
    };
}

const exigirChatAbierto = (estado: estadoTransaccion): void => {
    if (estado !== estadoTransaccion.PENDIENTE) {
        throw new ConflictError('El chat solo está disponible cuando la transacción está PENDIENTE');
    }
};

export const mensajeService = {
    /** Valida que el usuario pueda usar el chat de la transacción (participante y transacción PENDIENTE). */
    async validarAccesoChat(idUsuario: number, idTransaccion: number): Promise<void> {
        const { estado } = await leerParticipacion(AppDataSource.manager, idUsuario, idTransaccion);
        exigirChatAbierto(estado);
    },

    /** Guarda un mensaje; el estado se revalida en cada envío porque puede cambiar mientras el socket sigue en la sala. */
    async enviar(idUsuario: number, idTransaccion: number, contenido: string): Promise<{ mensaje: MensajeChat; idDestinatario: number }> {
        return AppDataSource.transaction(async (manager) => {
            const { estado, idOtro } = await leerParticipacion(manager, idUsuario, idTransaccion, true);
            exigirChatAbierto(estado);

            const [fila]: any[] = await manager.query(
                `INSERT INTO mensaje (id_transaccion, id_emisor, contenido) VALUES ($1, $2, $3)
                 RETURNING id_mensaje, id_emisor, contenido, leido, fecha_envio`,
                [idTransaccion, idUsuario, contenido]
            );
            return { mensaje: proyectarMensaje(idTransaccion, fila), idDestinatario: idOtro };
        });
    },

    /**
     * Marca como leídos los mensajes que `idUsuario` recibió (hasta `hastaIdMensaje`, o todos si se omite) y avisa a la sala.
     * No exige que el chat siga abierto: solo cambia un indicador.
     */
    async marcarLeidos(idUsuario: number, idTransaccion: number, hastaIdMensaje?: number): Promise<{ cantidad: number }> {
        await leerParticipacion(AppDataSource.manager, idUsuario, idTransaccion);

        const filas = filasDe<{ id_mensaje: number }>(await AppDataSource.query(
            `UPDATE mensaje SET leido = true
             WHERE id_transaccion = $1 AND id_emisor <> $2 AND leido = false
               AND ($3::int IS NULL OR id_mensaje <= $3::int)
             RETURNING id_mensaje`,
            [idTransaccion, idUsuario, hastaIdMensaje ?? null]
        ));
        if (filas.length > 0) {
            emitirMensajesLeidos({
                id_transaccion: idTransaccion,
                id_lector: idUsuario,
                hasta_id_mensaje: Math.max(...filas.map(f => Number(f.id_mensaje)))
            });
        }
        return { cantidad: filas.length };
    },

    /** Mensajes sin leer que `idUsuario` tiene en cada transacción dada; las que no tienen ninguno no aparecen. */
    async contarNoLeidos(idUsuario: number, idsTransaccion: number[]): Promise<Map<number, number>> {
        if (idsTransaccion.length === 0) return new Map();
        const filas: { id_transaccion: number; n: number }[] = await AppDataSource.query(
            `SELECT id_transaccion, COUNT(*)::int AS n FROM mensaje
             WHERE id_transaccion = ANY($1::int[]) AND id_emisor <> $2 AND leido = false
             GROUP BY id_transaccion`,
            [idsTransaccion, idUsuario]
        );
        return new Map(filas.map(f => [Number(f.id_transaccion), Number(f.n)]));
    },

    /**
     * Historial en orden cronológico. Sin cursores devuelve los últimos mensajes; `antes` pagina hacia atrás y
     * `despues` recupera lo perdido tras una reconexión. Es de solo lectura, así que sigue disponible al cerrarse el chat.
     */
    async listarHistorial(idUsuario: number, idTransaccion: number, opciones: OpcionesHistorial = {}) {
        await leerParticipacion(AppDataSource.manager, idUsuario, idTransaccion);

        const limite = Math.min(opciones.limite ?? 50, 100);
        const haciaAdelante = opciones.despues !== undefined;
        const filas: any[] = await AppDataSource.query(
            `SELECT id_mensaje, id_emisor, contenido, leido, fecha_envio FROM mensaje
             WHERE id_transaccion = $1
               AND ($2::int IS NULL OR id_mensaje < $2::int)
               AND ($3::int IS NULL OR id_mensaje > $3::int)
             ORDER BY id_mensaje ${haciaAdelante ? 'ASC' : 'DESC'}
             LIMIT $4`,
            [idTransaccion, opciones.antes ?? null, opciones.despues ?? null, limite]
        );
        if (!haciaAdelante) filas.reverse();

        return filas.map(f => proyectarMensaje(idTransaccion, f));
    }
};
