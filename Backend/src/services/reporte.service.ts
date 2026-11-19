import { type EntityManager } from 'typeorm';
import { AppDataSource } from '../config/db.config.js';
import { LIMITES_REPORTES } from '../config/transaccion.config.js';
import { estadoReporte, Motivo } from '../entities/reporte.entity.js';
import { BadRequestError, ConflictError, NotFoundError } from '../handlers/errorHandlers.js';
import { desconectarUsuario } from '../sockets/chat.emitter.js';
import { filasDe } from '../utils/db.js';
import { cancelarActivasDeUsuario, publicarCancelaciones } from './transaccion.service.js';

export interface DatosReporte {
    motivo: Motivo;
    descripcion_reporte: string;
}

export interface FiltrosReportes {
    estado?: estadoReporte | undefined;
    limite?: number | undefined;
    offset?: number | undefined;
}

/** Transiciones permitidas; DESESTIMADO y SANCIONADO son estados finales. */
const TRANSICIONES: Record<estadoReporte, estadoReporte[]> = {
    [estadoReporte.PENDIENTE]: [estadoReporte.DESESTIMADO, estadoReporte.ARCHIVADO, estadoReporte.SANCIONADO],
    [estadoReporte.ARCHIVADO]: [estadoReporte.DESESTIMADO, estadoReporte.SANCIONADO],
    [estadoReporte.DESESTIMADO]: [],
    [estadoReporte.SANCIONADO]: []
};

/** Mensajes del chat de la transacción asociada, en orden cronológico; `[]` si el reporte es de perfil. */
const SQL_CHAT = `COALESCE((
    SELECT json_agg(json_build_object(
        'id_mensaje', m.id_mensaje,
        'id_emisor', m.id_emisor,
        'contenido', m.contenido,
        'fecha_envio', m.fecha_envio
    ) ORDER BY m.fecha_envio, m.id_mensaje)
    FROM mensaje m
    WHERE m.id_transaccion = r.id_transaccion
), '[]'::json)`;

const iso = (fecha: Date | string | null) => (fecha ? new Date(fecha).toISOString() : null);

/** Lee y bloquea al reportante para serializar la comprobación de duplicados. */
async function bloquearUsuario(manager: EntityManager, idUsuario: number): Promise<void> {
    await manager.query(`SELECT id_usuario FROM usuario WHERE id_usuario = $1 FOR UPDATE`, [idUsuario]);
}

export const reporteService = {
    /**
     * Reporte a la contraparte de una transacción. Solo participantes, dentro del plazo desde el último cambio de estado,
     * y como máximo un reporte por reportante y transacción, sin importar su estado.
     */
    async crearDesdeTransaccion(idReportante: number, idTransaccion: number, datos: DatosReporte) {
        return AppDataSource.transaction(async (manager) => {
            await bloquearUsuario(manager, idReportante);

            const [transaccion] = filasDe(await manager.query(
                `SELECT id_transaccion, id_usuario_1, id_usuario_2,
                        fecha_estado >= NOW() - ($2::int * INTERVAL '1 day') AS vigente
                 FROM transaccion WHERE id_transaccion = $1`,
                [idTransaccion, LIMITES_REPORTES.diasPlazoReporte]
            ));
            const esParticipante = transaccion && (Number(transaccion.id_usuario_1) === idReportante || Number(transaccion.id_usuario_2) === idReportante);
            if (!esParticipante) throw new NotFoundError('Transacción no encontrada');
            if (!transaccion.vigente) {
                throw new ConflictError(`El plazo de ${LIMITES_REPORTES.diasPlazoReporte} días para reportar esta transacción ha vencido`);
            }

            const idReportado = Number(transaccion.id_usuario_1) === idReportante
                ? Number(transaccion.id_usuario_2)
                : Number(transaccion.id_usuario_1);

            const duplicado = await manager.query(
                `SELECT 1 FROM reporte WHERE id_usuario_reportante = $1 AND id_transaccion = $2 LIMIT 1`,
                [idReportante, idTransaccion]
            );
            if (duplicado.length > 0) throw new ConflictError('Ya reportaste a este usuario por esta transacción');

            const [reporte] = filasDe(await manager.query(
                `INSERT INTO reporte (id_usuario_reportante, id_usuario_reportado, id_transaccion, motivo, descripcion_reporte, estado)
                 VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
                 RETURNING id_reporte, estado, fecha_creacion`,
                [idReportante, idReportado, idTransaccion, datos.motivo, datos.descripcion_reporte]
            ));

            return {
                id_reporte: Number(reporte.id_reporte),
                id_transaccion: idTransaccion,
                estado: reporte.estado as estadoReporte,
                fecha_creacion: iso(reporte.fecha_creacion)
            };
        });
    },

    /** Reporte directo a un usuario desde su perfil (sin transacción asociada). Máximo un PENDIENTE por par de usuarios. */
    async crearDesdePerfil(idReportante: number, idReportado: number, datos: DatosReporte) {
        if (idReportante === idReportado) {
            throw new BadRequestError('No puedes reportarte a ti mismo');
        }

        return AppDataSource.transaction(async (manager) => {
            await bloquearUsuario(manager, idReportante);

            const [existe] = filasDe(await manager.query(`SELECT 1 FROM usuario WHERE id_usuario = $1`, [idReportado]));
            if (!existe) throw new NotFoundError('Usuario no encontrado');

            const duplicado = await manager.query(
                `SELECT 1 FROM reporte
                 WHERE id_usuario_reportante = $1 AND id_usuario_reportado = $2
                   AND id_transaccion IS NULL AND estado = 'PENDIENTE' LIMIT 1`,
                [idReportante, idReportado]
            );
            if (duplicado.length > 0) throw new ConflictError('Ya tienes un reporte pendiente para este usuario');

            const [reporte] = filasDe(await manager.query(
                `INSERT INTO reporte (id_usuario_reportante, id_usuario_reportado, id_transaccion, motivo, descripcion_reporte, estado)
                 VALUES ($1, $2, NULL, $3, $4, 'PENDIENTE')
                 RETURNING id_reporte, estado, fecha_creacion`,
                [idReportante, idReportado, datos.motivo, datos.descripcion_reporte]
            ));

            return {
                id_reporte: Number(reporte.id_reporte),
                id_transaccion: null,
                estado: reporte.estado as estadoReporte,
                fecha_creacion: iso(reporte.fecha_creacion)
            };
        });
    },

    /** Listado para el administrador; cada reporte incluye el chat de su transacción (vacío si no tiene). */
    async listar({ estado, limite = 20, offset = 0 }: FiltrosReportes) {
        const filtro = estado ?? null;

        const [{ total }] = await AppDataSource.query(
            `SELECT COUNT(*)::int AS total FROM reporte WHERE ($1::text IS NULL OR estado::text = $1)`,
            [filtro]
        );
        const filas: any[] = await AppDataSource.query(
                `SELECT r.id_reporte, r.motivo, r.descripcion_reporte, r.estado, r.resolucion, r.fecha_creacion, r.id_transaccion,
                    ur.id_usuario AS id_reportante, ur.nombre_usuario AS nombre_reportante,
                    ud.id_usuario AS id_reportado, ud.nombre_usuario AS nombre_reportado, ud.suspendido AS reportado_suspendido,
                    ${SQL_CHAT} AS chat
             FROM reporte r
             JOIN usuario ur ON ur.id_usuario = r.id_usuario_reportante
             JOIN usuario ud ON ud.id_usuario = r.id_usuario_reportado
             WHERE ($1::text IS NULL OR r.estado::text = $1)
             ORDER BY r.fecha_creacion DESC, r.id_reporte DESC
             LIMIT $2 OFFSET $3`,
            [filtro, Math.min(limite, 100), offset]
        );

        return {
            total: Number(total),
            resultados: filas.map(f => ({
                id_reporte: Number(f.id_reporte),
                motivo: f.motivo as Motivo,
                descripcion_reporte: String(f.descripcion_reporte),
                estado: f.estado as estadoReporte,
                resolucion: f.resolucion === null ? null : String(f.resolucion),
                fecha_creacion: iso(f.fecha_creacion),
                id_transaccion: f.id_transaccion === null ? null : Number(f.id_transaccion),
                reportante: { id_usuario: Number(f.id_reportante), nombre_usuario: String(f.nombre_reportante) },
                reportado: {
                    id_usuario: Number(f.id_reportado),
                    nombre_usuario: String(f.nombre_reportado),
                    suspendido: Boolean(f.reportado_suspendido)
                },
                chat: f.chat
            }))
        };
    },

    /**
     * Detalle para moderar: reporte, transacción con su chat y antecedentes del reportado
     * (otros reportes PENDIENTE o ARCHIVADO contra el mismo usuario; los DESESTIMADO y SANCIONADO no se muestran).
     */
    async detalle(idReporte: number) {
        const [f] = filasDe(await AppDataSource.query(
            `SELECT r.id_reporte, r.motivo, r.descripcion_reporte, r.estado, r.resolucion, r.fecha_creacion, r.fecha_recepcion, r.id_transaccion,
                    ur.id_usuario AS id_reportante, ur.nombre_usuario AS nombre_reportante,
                    ud.id_usuario AS id_reportado, ud.nombre_usuario AS nombre_reportado, ud.suspendido AS reportado_suspendido,
                    t.estado AS estado_transaccion, t.fecha_creacion AS fecha_creacion_transaccion,
                    t.fecha_estado AS fecha_estado_transaccion, t.id_usuario_1, t.id_usuario_2,
                    ${SQL_CHAT} AS chat
             FROM reporte r
             JOIN usuario ur ON ur.id_usuario = r.id_usuario_reportante
             JOIN usuario ud ON ud.id_usuario = r.id_usuario_reportado
             LEFT JOIN transaccion t ON t.id_transaccion = r.id_transaccion
             WHERE r.id_reporte = $1`,
            [idReporte]
        ));
        if (!f) throw new NotFoundError('Reporte no encontrado');

        const antecedentes: any[] = await AppDataSource.query(
            `SELECT id_reporte, motivo, estado, fecha_creacion FROM reporte
             WHERE id_usuario_reportado = $1 AND id_reporte <> $2 AND estado IN ('PENDIENTE', 'ARCHIVADO')
             ORDER BY fecha_creacion DESC`,
            [f.id_reportado, idReporte]
        );

        return {
            id_reporte: Number(f.id_reporte),
            motivo: f.motivo as Motivo,
            descripcion_reporte: String(f.descripcion_reporte),
            estado: f.estado as estadoReporte,
            resolucion: f.resolucion === null ? null : String(f.resolucion),
            fecha_creacion: iso(f.fecha_creacion),
            reportante: { id_usuario: Number(f.id_reportante), nombre_usuario: String(f.nombre_reportante) },
            reportado: {
                id_usuario: Number(f.id_reportado),
                nombre_usuario: String(f.nombre_reportado),
                suspendido: Boolean(f.reportado_suspendido)
            },
            transaccion: f.id_transaccion === null ? null : {
                id_transaccion: Number(f.id_transaccion),
                estado: f.estado_transaccion,
                fecha_creacion: iso(f.fecha_creacion_transaccion),
                fecha_estado: iso(f.fecha_estado_transaccion),
                id_usuario_1: Number(f.id_usuario_1),
                id_usuario_2: Number(f.id_usuario_2)
            },
            chat: f.chat,
            antecedentes: antecedentes.map(a => ({
                id_reporte: Number(a.id_reporte),
                motivo: a.motivo as Motivo,
                estado: a.estado as estadoReporte,
                fecha_creacion: iso(a.fecha_creacion)
            }))
        };
    },

    /**
     * Cambia el estado de un reporte respetando TRANSICIONES. SANCIONADO suspende al reportado y cancela sus transacciones activas
     * en la misma transacción de BD; el aviso por socket y la desconexión se hacen tras el commit.
     */
    async cambiarEstado(idReporte: number, nuevoEstado: estadoReporte, resolucion: string | null = null) {
        const resultado = await AppDataSource.transaction(async (manager) => {
            const [reporte] = filasDe(await manager.query(
                `SELECT id_reporte, estado, id_usuario_reportado FROM reporte WHERE id_reporte = $1 FOR UPDATE`,
                [idReporte]
            ));
            if (!reporte) throw new NotFoundError('Reporte no encontrado');

            const actual = reporte.estado as estadoReporte;
            if (!TRANSICIONES[actual].includes(nuevoEstado)) {
                throw new ConflictError(`No se puede cambiar un reporte ${actual} a ${nuevoEstado}`);
            }

            await manager.query(
                `UPDATE reporte SET estado = $2, resolucion = $3 WHERE id_reporte = $1`,
                [idReporte, nuevoEstado, resolucion]
            );

            const idReportado = Number(reporte.id_usuario_reportado);
            let canceladas: Awaited<ReturnType<typeof cancelarActivasDeUsuario>> = [];
            if (nuevoEstado === estadoReporte.SANCIONADO) {
                await manager.query(`UPDATE usuario SET suspendido = true WHERE id_usuario = $1`, [idReportado]);
                canceladas = await cancelarActivasDeUsuario(manager, idReportado);
            }

            return { id_reporte: idReporte, estado: nuevoEstado, anterior: actual, idReportado, canceladas };
        });

        if (resultado.estado === estadoReporte.SANCIONADO) {
            publicarCancelaciones(resultado.canceladas, 'CANCELADA');
            desconectarUsuario(resultado.idReportado);
        }

        return { id_reporte: resultado.id_reporte, estado: resultado.estado, estado_anterior: resultado.anterior, resolucion };
    },

    /** Levanta la suspensión de una cuenta; no revierte las transacciones ya canceladas. */
    async levantarSuspension(idUsuario: number) {
        const filas = filasDe(await AppDataSource.query(
            `UPDATE usuario SET suspendido = false WHERE id_usuario = $1 RETURNING id_usuario, suspendido`,
            [idUsuario]
        ));
        if (filas.length === 0) throw new NotFoundError('Usuario no encontrado');
        return { id_usuario: Number(filas[0].id_usuario), suspendido: Boolean(filas[0].suspendido) };
    }
};
