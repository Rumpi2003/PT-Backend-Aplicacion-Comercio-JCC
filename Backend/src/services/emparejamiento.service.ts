import { AppDataSource } from '../config/db.config.js';
import type { Estado } from '../entities/cartaOfrecida.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { estadoTransaccion } from '../entities/transaccion.entity.js';
import { NotFoundError, ConflictError } from '../handlers/errorHandlers.js';
import { In } from 'typeorm';

const calidadEstado: Record<Estado, number> = {
    PERFECTA: 7,
    RECIEN_ABIERTA: 6,
    DESGASTE_MENOR: 5,
    DESGASTE_VISIBLE: 4,
    DESGASTE_SEVERO: 3,
    DAÑADA: 2,
    DESTRUIDA: 1
};

const calidad = (estado: string): number => calidadEstado[estado as Estado];

// Se interpolan solo constantes del enum (nunca input del usuario)
const calidadSql = (columna: string): string =>
    `CASE ${columna}::text ${Object.entries(calidadEstado).map(([e, v]) => `WHEN '${e}' THEN ${v}`).join(' ')} END`;

const ESTADOS_ACTIVOS_SQL = [estadoTransaccion.EN_NEGOCIACION, estadoTransaccion.PENDIENTE]
    .map(e => `'${e}'`).join(',');

const MAX_PUNTUACION_RESENA = 5;
const K_BAYES = 5;
const MAX_ANTIGUEDAD_GEO_HORAS = 24;
const MAX_CALIDAD = 7;

const PESOS = {
    cobertura: 0.45,
    reciprocidad: 0.20,
    precio: 0.15,
    distancia: 0.10,
    reputacion: 0.07,
    estado: 0.03
} as const;

// Stock ya comprometido en transacciones activas
const SQL_RESERVADO = `
    LEFT JOIN LATERAL (
        SELECT SUM(dt.cantidad)::int AS reservada
        FROM detalle_transaccion dt
        JOIN transaccion tr ON tr.id_transaccion = dt.id_transaccion
        WHERE dt.id_carta_ofrecida = o.id_carta_ofrecida
          AND tr.estado IN (${ESTADOS_ACTIVOS_SQL})
    ) r ON true`;

export interface OpcionesEmparejamiento {
    usarGeolocalizacion?: boolean | undefined;
    limite?: number | undefined;
    offset?: number | undefined;
}

interface ParCompatible {
    id_candidato: number;
    id_carta_deseada: number;
    cantidad_deseada: number;
    estado_minimo: string;
    id_carta_ofrecida: number;
    id_tipo_carta: number;
    estado: string;
    precio: number;
    stock_disponible: number;
}

interface ParDirecto extends ParCompatible {
    nombre_carta: string;
    set: string;
    url_imagen: string;
    url_miniatura: string;
    idioma: string;
    distancia_m: number | null;
}

interface Asignacion<T extends ParCompatible> {
    par: T;
    cantidad: number;
}

export interface DatosCandidato {
    unidadesCubiertas: number;
    unidadesReciprocas: number;
    valorRecibo: number;
    valorEntrego: number;
    precioRelativo: number;
    calidadPromedio: number;
    distanciaM: number | null;
    ratingPromedio: number;
    nResenas: number;
}

export interface ContextoPuntuacion {
    maxCubiertas: number;
    maxReciprocas: number;
    usarGeo: boolean;
    radioGeoM: number;
    ratingGlobal: number;
}

const acotar = (x: number): number => Math.min(1, Math.max(0, x));

/** Reparte unidades sin contar dos veces una misma carta ofrecida ni una misma necesidad. */
function asignarUnidades<T extends ParCompatible>(pares: T[]): Asignacion<T>[] {
    const demanda = new Map<number, number>();
    const stock = new Map<number, number>();
    for (const p of pares) {
        demanda.set(p.id_carta_deseada, p.cantidad_deseada);
        stock.set(p.id_carta_ofrecida, p.stock_disponible);
    }

    // Deseos más exigentes primero; entre ofertas, la de menor calidad suficiente y más barata
    const ordenados = [...pares].sort((a, b) =>
        calidad(b.estado_minimo) - calidad(a.estado_minimo)
        || calidad(a.estado) - calidad(b.estado)
        || a.precio - b.precio);

    const resultado: Asignacion<T>[] = [];
    for (const par of ordenados) {
        const faltante = demanda.get(par.id_carta_deseada) ?? 0;
        const disponible = stock.get(par.id_carta_ofrecida) ?? 0;
        const cantidad = Math.min(faltante, disponible);
        if (cantidad <= 0) continue;
        demanda.set(par.id_carta_deseada, faltante - cantidad);
        stock.set(par.id_carta_ofrecida, disponible - cantidad);
        resultado.push({ par, cantidad });
    }
    return resultado;
}

function agruparPorCandidato<T extends { id_candidato: number }>(items: T[]): Map<number, T[]> {
    const mapa = new Map<number, T[]>();
    for (const item of items) {
        const lista = mapa.get(item.id_candidato);
        if (lista) lista.push(item);
        else mapa.set(item.id_candidato, [item]);
    }
    return mapa;
}

const sumar = <T>(items: T[], f: (t: T) => number): number =>
    items.reduce((acc, item) => acc + f(item), 0);

export const emparejamientoService = {
    /**
     * Devuelve los pares (carta deseada del usuario, carta ofrecida por otro usuario) que cumplen
     * todas las condiciones de elegibilidad: perfil visible, idioma, estado mínimo, stock libre
     * (descontando transacciones activas), sin transacción activa entre ambos y, si aplica, dentro del radio.
     */
    async obtenerCoincidenciasElegibles(
        idUsuario: number,
        usarGeo: boolean,
        radioGeoM: number
    ): Promise<ParDirecto[]> {
        const filas: any[] = await AppDataSource.query(`
            SELECT
                c.id_usuario          AS id_candidato,
                d.id_carta_deseada,
                d.cantidad            AS cantidad_deseada,
                d.estado_minimo::text AS estado_minimo,
                o.id_carta_ofrecida,
                o.id_tipo_carta,
                t.nombre_carta,
                t."set",
                t.url_imagen,
                t.url_miniatura,
                o.idioma,
                o.estado::text        AS estado,
                o.precio,
                (o.cantidad - COALESCE(r.reservada, 0)) AS stock_disponible,
                CASE WHEN $2::boolean
                     THEN ST_Distance(c.ultimas_coordenadas, s.ultimas_coordenadas) END AS distancia_m
            FROM carta_deseada d
            JOIN usuario s        ON s.id_usuario = d.id_usuario
            JOIN carta_ofrecida o ON o.id_tipo_carta = d.id_tipo_carta
                                 AND o.idioma = d.idioma
                                 AND o.fecha_eliminacion IS NULL
            JOIN usuario c        ON c.id_usuario = o.id_usuario
            JOIN tipo_carta t     ON t.id_tipo_carta = o.id_tipo_carta
            ${SQL_RESERVADO}
            WHERE d.id_usuario = $1
              AND c.id_usuario <> $1
              AND c.visibilidad_perfil = true
              AND (o.cantidad - COALESCE(r.reservada, 0)) > 0
              AND ${calidadSql('o.estado')} >= ${calidadSql('d.estado_minimo')}
              AND NOT EXISTS (
                  SELECT 1 FROM transaccion tx
                  WHERE tx.estado IN (${ESTADOS_ACTIVOS_SQL})
                    AND ((tx.id_usuario_1 = $1 AND tx.id_usuario_2 = c.id_usuario)
                      OR (tx.id_usuario_1 = c.id_usuario AND tx.id_usuario_2 = $1))
              )
              AND (
                  NOT $2::boolean
                  OR (
                      c.ultimas_coordenadas IS NOT NULL
                      AND s.ultimas_coordenadas IS NOT NULL
                      AND c.ultima_update_geo >= NOW() - make_interval(hours => $4::int)
                      AND ST_DWithin(c.ultimas_coordenadas, s.ultimas_coordenadas, $3::float)
                  )
              )
        `, [idUsuario, usarGeo, radioGeoM, MAX_ANTIGUEDAD_GEO_HORAS]);

        return filas.map(f => ({
            id_candidato: Number(f.id_candidato),
            id_carta_deseada: Number(f.id_carta_deseada),
            cantidad_deseada: Number(f.cantidad_deseada),
            estado_minimo: String(f.estado_minimo),
            id_carta_ofrecida: Number(f.id_carta_ofrecida),
            id_tipo_carta: Number(f.id_tipo_carta),
            nombre_carta: String(f.nombre_carta),
            set: String(f.set),
            url_imagen: String(f.url_imagen),
            url_miniatura: String(f.url_miniatura),
            idioma: String(f.idioma),
            estado: String(f.estado),
            precio: Number(f.precio),
            stock_disponible: Number(f.stock_disponible),
            distancia_m: f.distancia_m === null ? null : Number(f.distancia_m)
        }));
    },

    calcularPuntuacion(c: DatosCandidato, ctx: ContextoPuntuacion) {
        const cobertura = ctx.maxCubiertas > 0 ? c.unidadesCubiertas / ctx.maxCubiertas : 0;

        const mayorValor = Math.max(c.valorRecibo, c.valorEntrego);
        const equilibrio = mayorValor > 0 ? Math.min(c.valorRecibo, c.valorEntrego) / mayorValor : 0;
        const coberturaInversa = ctx.maxReciprocas > 0 ? c.unidadesReciprocas / ctx.maxReciprocas : 0;
        const reciprocidad = 0.7 * coberturaInversa + 0.3 * equilibrio;

        const distancia = ctx.usarGeo && c.distanciaM !== null && ctx.radioGeoM > 0
            ? acotar(1 - c.distanciaM / ctx.radioGeoM)
            : 0;

        // Media bayesiana: con pocas reseñas el rating tiende a la media global
        const n = c.nResenas;
        const rating = (n / (n + K_BAYES)) * c.ratingPromedio + (K_BAYES / (n + K_BAYES)) * ctx.ratingGlobal;
        const reputacion = acotar(rating / MAX_PUNTUACION_RESENA);

        const componentes = {
            cobertura,
            reciprocidad,
            precio: acotar(c.precioRelativo),
            distancia,
            reputacion,
            estado: acotar(c.calidadPromedio / MAX_CALIDAD)
        };

        // Sin geolocalización el peso de la distancia se redistribuye entre los demás factores
        const factores = (Object.keys(PESOS) as (keyof typeof PESOS)[])
            .filter(k => ctx.usarGeo || k !== 'distancia');
        const sumaPesos = sumar(factores, k => PESOS[k]);
        const puntuacion = sumar(factores, k => PESOS[k] * componentes[k]) / sumaPesos;

        return { puntuacion: Number(puntuacion.toFixed(4)), desglose: componentes };
    },

    async obtenerEmparejamientos(idUsuario: number, opciones: OpcionesEmparejamiento = {}) {
        const limite = Math.min(opciones.limite ?? 20, 100);
        const offset = opciones.offset ?? 0;

        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const solicitante = await usuarioRepo.findOne({ where: { id_usuario: idUsuario } });
        if (!solicitante) throw new NotFoundError('Usuario no encontrado');

        const usarGeo = opciones.usarGeolocalizacion ?? solicitante.modo_geo_activado;
        if (usarGeo) {
            const limiteFecha = Date.now() - MAX_ANTIGUEDAD_GEO_HORAS * 3_600_000;
            if (!solicitante.ultimas_coordenadas
                || !solicitante.ultima_update_geo
                || new Date(solicitante.ultima_update_geo).getTime() < limiteFecha) {
                throw new ConflictError('Debes actualizar tu ubicación para usar el modo geolocalizado');
            }
            if (solicitante.radio_geo <= 0) {
                throw new ConflictError('Debes definir un radio geográfico para usar el modo geolocalizado');
            }
        }

        const [{ total: totalDeseadas }] = await AppDataSource.query(
            `SELECT COALESCE(SUM(cantidad), 0)::int AS total FROM carta_deseada WHERE id_usuario = $1`,
            [idUsuario]
        );
        const vacio = { total: 0, resultados: [] };
        if (totalDeseadas === 0) return vacio;

        const pares = await emparejamientoService.obtenerCoincidenciasElegibles(
            idUsuario, usarGeo, solicitante.radio_geo
        );
        if (pares.length === 0) return vacio;

        const paresPorCandidato = agruparPorCandidato(pares);
        const idsCandidatos = [...paresPorCandidato.keys()];

        const precioMinimo = new Map<number, number>();
        for (const p of pares) {
            precioMinimo.set(p.id_tipo_carta, Math.min(precioMinimo.get(p.id_tipo_carta) ?? Infinity, p.precio));
        }

        // Reciprocidad: lo que cada candidato desea de mi inventario
        const filasInversas: any[] = await AppDataSource.query(`
            SELECT d.id_usuario AS id_candidato, d.id_carta_deseada, d.cantidad AS cantidad_deseada,
                   d.estado_minimo::text AS estado_minimo, o.id_carta_ofrecida, o.id_tipo_carta,
                   o.estado::text AS estado, o.precio,
                   (o.cantidad - COALESCE(r.reservada, 0)) AS stock_disponible
            FROM carta_deseada d
            JOIN carta_ofrecida o ON o.id_usuario = $1
                                 AND o.id_tipo_carta = d.id_tipo_carta
                                 AND o.idioma = d.idioma
                                 AND o.fecha_eliminacion IS NULL
            ${SQL_RESERVADO}
            WHERE d.id_usuario = ANY($2::int[])
              AND (o.cantidad - COALESCE(r.reservada, 0)) > 0
              AND ${calidadSql('o.estado')} >= ${calidadSql('d.estado_minimo')}
        `, [idUsuario, idsCandidatos]);
        const inversasPorCandidato = agruparPorCandidato<ParCompatible>(filasInversas.map(f => ({
            id_candidato: Number(f.id_candidato),
            id_carta_deseada: Number(f.id_carta_deseada),
            cantidad_deseada: Number(f.cantidad_deseada),
            estado_minimo: String(f.estado_minimo),
            id_carta_ofrecida: Number(f.id_carta_ofrecida),
            id_tipo_carta: Number(f.id_tipo_carta),
            estado: String(f.estado),
            precio: Number(f.precio),
            stock_disponible: Number(f.stock_disponible)
        })));

        // Reputación calculada desde las reseñas reales
        const filasResenas: any[] = await AppDataSource.query(
            `SELECT "id_usuario_reseñado" AS id, COUNT(*)::int AS n, AVG(puntuacion)::float AS media
             FROM "reseña" WHERE "id_usuario_reseñado" = ANY($1::int[]) GROUP BY 1`,
            [idsCandidatos]
        );
        const resenas = new Map<number, { n: number; media: number }>(
            filasResenas.map(f => [Number(f.id), { n: Number(f.n), media: Number(f.media) }])
        );
        const [{ media: ratingGlobal }] = await AppDataSource.query(
            `SELECT COALESCE(AVG(puntuacion), 3)::float AS media FROM "reseña"`
        );

        const usuarios = await usuarioRepo.find({
            where: { id_usuario: In(idsCandidatos) },
            relations: { comuna: true }
        });
        const usuarioPorId = new Map(usuarios.map(u => [u.id_usuario, u]));

        const candidatos = idsCandidatos.flatMap(id => {
            const usuario = usuarioPorId.get(id);
            const paresCandidato = paresPorCandidato.get(id);
            if (!usuario || !paresCandidato) return [];

            const directas = asignarUnidades(paresCandidato);
            const unidades = sumar(directas, a => a.cantidad);
            if (unidades === 0) return [];

            const reciprocas = asignarUnidades(inversasPorCandidato.get(id) ?? []);
            const resena = resenas.get(id);

            const datos: DatosCandidato = {
                unidadesCubiertas: unidades,
                unidadesReciprocas: sumar(reciprocas, a => a.cantidad),
                valorRecibo: sumar(directas, a => a.cantidad * a.par.precio),
                valorEntrego: sumar(reciprocas, a => a.cantidad * a.par.precio),
                precioRelativo: sumar(directas, a => {
                    const minimo = precioMinimo.get(a.par.id_tipo_carta) ?? a.par.precio;
                    const relativo = a.par.precio === 0 ? 1 : minimo / a.par.precio;
                    return relativo * a.cantidad;
                }) / unidades,
                calidadPromedio: sumar(directas, a => calidad(a.par.estado) * a.cantidad) / unidades,
                distanciaM: paresCandidato[0]?.distancia_m ?? null,
                ratingPromedio: resena?.media ?? 0,
                nResenas: resena?.n ?? 0
            };
            return [{ id, usuario, directas, datos }];
        });
        if (candidatos.length === 0) return vacio;

        const ctx: ContextoPuntuacion = {
            maxCubiertas: Math.max(...candidatos.map(c => c.datos.unidadesCubiertas)),
            maxReciprocas: Math.max(...candidatos.map(c => c.datos.unidadesReciprocas)),
            usarGeo,
            radioGeoM: solicitante.radio_geo,
            ratingGlobal: Number(ratingGlobal)
        };

        const ranking = candidatos
            .map(c => ({ ...c, ...emparejamientoService.calcularPuntuacion(c.datos, ctx) }))
            .sort((a, b) =>
                b.puntuacion - a.puntuacion
                || b.datos.unidadesCubiertas - a.datos.unidadesCubiertas
                || b.datos.unidadesReciprocas - a.datos.unidadesReciprocas
                || (a.datos.distanciaM ?? Infinity) - (b.datos.distanciaM ?? Infinity)
                || b.datos.ratingPromedio - a.datos.ratingPromedio
                || a.id - b.id);

        return {
            total: ranking.length,
            resultados: ranking.slice(offset, offset + limite).map(c => ({
                usuario: {
                    id_usuario: c.id,
                    nombre_usuario: c.usuario.nombre_usuario,
                    descripcion_perfil: c.usuario.descripcion_perfil,
                    puntuacion_promedio: c.usuario.puntuacion_promedio,
                    comuna: c.usuario.comuna.nombre_comuna
                },
                puntuacion: c.puntuacion,
                distancia_m: c.datos.distanciaM,
                cartas_coincidentes: c.directas.map(a => ({
                    id_carta_ofrecida: a.par.id_carta_ofrecida,
                    id_tipo_carta: a.par.id_tipo_carta,
                    nombre_carta: a.par.nombre_carta,
                    set: a.par.set,
                    url_imagen: a.par.url_imagen,
                    url_miniatura: a.par.url_miniatura,
                    idioma: a.par.idioma,
                    estado: a.par.estado,
                    precio: a.par.precio,
                    cantidad: a.cantidad
                })),
                resumen: {
                    unidades_cubiertas: c.datos.unidadesCubiertas,
                    unidades_deseadas: totalDeseadas,
                    porcentaje_cobertura: Number((c.datos.unidadesCubiertas / totalDeseadas).toFixed(4)),
                    unidades_reciprocas: c.datos.unidadesReciprocas
                },
                desglose: c.desglose
            }))
        };
    }
};