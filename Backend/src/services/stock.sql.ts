import type { Estado } from '../entities/cartaOfrecida.entity.js';
import { estadoTransaccion } from '../entities/transaccion.entity.js';

export const calidadEstado: Record<Estado, number> = {
    PERFECTA: 7,
    RECIEN_ABIERTA: 6,
    DESGASTE_MENOR: 5,
    DESGASTE_VISIBLE: 4,
    DESGASTE_SEVERO: 3,
    DAÑADA: 2,
    DESTRUIDA: 1
};

export const calidad = (estado: string): number => calidadEstado[estado as Estado];

// Se interpolan solo constantes del enum (nunca input del usuario)
export const calidadSql = (columna: string): string =>
    `CASE ${columna}::text ${Object.entries(calidadEstado).map(([e, v]) => `WHEN '${e}' THEN ${v}`).join(' ')} END`;

const aSql = (estados: estadoTransaccion[]): string => estados.map(e => `'${e}'`).join(',');

// Transacciones que impiden abrir otra propuesta entre el mismo par de usuarios
export const ESTADOS_ACTIVOS_SQL = aSql([estadoTransaccion.EN_NEGOCIACION, estadoTransaccion.PENDIENTE]);

// Solo una transacción PENDIENTE (aceptada por ambos) reserva stock
export const ESTADOS_RESERVA_SQL = aSql([estadoTransaccion.PENDIENTE]);

// Requiere que la carta ofrecida use el alias `o`; expone `r.reservada`
export const SQL_RESERVADO = `
    LEFT JOIN LATERAL (
        SELECT SUM(dt.cantidad)::int AS reservada
        FROM detalle_transaccion dt
        JOIN transaccion tr ON tr.id_transaccion = dt.id_transaccion
        WHERE dt.id_carta_ofrecida = o.id_carta_ofrecida
          AND tr.estado IN (${ESTADOS_RESERVA_SQL})
    ) r ON true`;
