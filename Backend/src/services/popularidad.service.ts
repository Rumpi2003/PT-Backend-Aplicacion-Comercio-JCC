import { AppDataSource } from '../config/db.config.js';

/** Cantidad de cartas que devuelve el ranking de popularidad. */
const TOP_POPULARIDAD = 10;
/** Ventana en la que cuentan las transacciones completadas. */
const VENTANA_DIAS = 30;
/** Peso de cada transacción completada en la ventana. */
const PESO_TRANSACCION = 3;
/** Peso de cada usuario que tiene la carta en su lista de deseos. */
const PESO_DESEO = 1;

export interface CartaPopular {
    id_tipo_carta: number;
    nombre_carta: string;
    set: string;
    rareza: string;
    url_imagen: string;
    url_miniatura: string;
    transacciones_completadas: number;
    usuarios_que_la_desean: number;
    puntaje: number;
}

export const popularidadService = {
    async obtenerTop(): Promise<CartaPopular[]> {
        const filas: any[] = await AppDataSource.query(
            `WITH completadas AS (
                SELECT co.id_tipo_carta, COUNT(DISTINCT t.id_transaccion)::int AS n
                FROM transaccion t
                JOIN detalle_transaccion dt ON dt.id_transaccion = t.id_transaccion
                JOIN carta_ofrecida co ON co.id_carta_ofrecida = dt.id_carta_ofrecida
                WHERE t.estado = 'COMPLETADA'
                  AND t.fecha_estado >= NOW() - ($1::int * INTERVAL '1 day')
                GROUP BY co.id_tipo_carta
             ),
             deseos AS (
                SELECT id_tipo_carta, COUNT(DISTINCT id_usuario)::int AS n
                FROM carta_deseada
                GROUP BY id_tipo_carta
             )
             SELECT tc.id_tipo_carta, tc.nombre_carta, tc.set, tc.rareza,
                    tc.url_imagen, tc.url_miniatura,
                    COALESCE(c.n, 0) AS transacciones_completadas,
                    COALESCE(d.n, 0) AS usuarios_que_la_desean,
                    ($2::int * COALESCE(c.n, 0) + $3::int * COALESCE(d.n, 0)) AS puntaje
             FROM tipo_carta tc
             LEFT JOIN completadas c ON c.id_tipo_carta = tc.id_tipo_carta
             LEFT JOIN deseos d ON d.id_tipo_carta = tc.id_tipo_carta
             WHERE COALESCE(c.n, 0) + COALESCE(d.n, 0) > 0
             ORDER BY puntaje DESC, tc.nombre_carta, tc.id_tipo_carta
             LIMIT $4`,
            [VENTANA_DIAS, PESO_TRANSACCION, PESO_DESEO, TOP_POPULARIDAD]
        );

        return filas.map(f => ({
            id_tipo_carta: Number(f.id_tipo_carta),
            nombre_carta: String(f.nombre_carta),
            set: String(f.set),
            rareza: String(f.rareza),
            url_imagen: String(f.url_imagen),
            url_miniatura: String(f.url_miniatura),
            transacciones_completadas: Number(f.transacciones_completadas),
            usuarios_que_la_desean: Number(f.usuarios_que_la_desean),
            puntaje: Number(f.puntaje)
        }));
    }
};
