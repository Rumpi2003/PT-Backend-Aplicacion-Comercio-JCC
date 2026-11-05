import { In, type EntityManager } from 'typeorm';
import { AppDataSource } from '../config/db.config.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Transaccion, estadoTransaccion } from '../entities/transaccion.entity.js';
import { DetalleTransaccion } from '../entities/detalleTransaccion.entity.js';
import { BadRequestError, ConflictError, NotFoundError } from '../handlers/errorHandlers.js';
import { LIMITES_TRANSACCION } from '../config/transaccion.config.js';
import { calidadSql, ESTADOS_ACTIVOS_SQL, SQL_RESERVADO } from './stock.sql.js';
import { emitirChatCerrado } from '../sockets/chat.emitter.js';
import { notificacionService } from './notificacion.service.js';
import { mensajeService } from './mensaje.service.js';
import { filasDe } from '../utils/db.js';

export interface CartaSolicitada {
    id_carta_ofrecida: number;
    cantidad: number;
    precio_ofertado?: number | undefined;
}

export interface CartaOfrecidaEnTransaccion {
    id_carta_ofrecida: number;
    cantidad: number;
}

export interface DatosCrearTransaccion {
    id_usuario_destino: number;
    solicitadas: CartaSolicitada[];
    ofrecidas?: CartaOfrecidaEnTransaccion[] | undefined;
}

interface CartaBloqueada {
    id_carta_ofrecida: number;
    id_usuario: number;
    precio: number;
    stock_disponible: number;
}

/** diferencia_a_pagar_N es lo que debe pagar el usuario N para equilibrar el valor de la transacción. */
export function calcularDiferencia(recibe1: number, entrega1: number) {
    const diferencia = recibe1 - entrega1;
    return {
        diferencia_a_pagar_1: Math.max(diferencia, 0),
        diferencia_a_pagar_2: Math.max(-diferencia, 0)
    };
}

const sumarValor = (items: { precio: number; cantidad: number }[]): number =>
    items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

export interface OpcionesListadoTransacciones {
    vista?: 'activas' | 'historial' | undefined;
    estado?: estadoTransaccion | undefined;
    limite?: number | undefined;
    offset?: number | undefined;
}

const ESTADOS_POR_VISTA: Record<'activas' | 'historial', estadoTransaccion[]> = {
    activas: [estadoTransaccion.EN_NEGOCIACION, estadoTransaccion.PENDIENTE],
    historial: [estadoTransaccion.COMPLETADA, estadoTransaccion.RECHAZADA, estadoTransaccion.CANCELADA]
};

const RELACIONES_TRANSACCION = {
    usuario_1: true,
    usuario_2: true,
    detalles_transaccion: { carta_ofrecida: { usuario: true, tipo_carta: true } }
} as const;

export interface TransaccionExpirada {
    id_transaccion: number;
    id_usuario_1: number;
    id_usuario_2: number;
    estado_anterior: estadoTransaccion;
}

/** Cierra el chat y avisa a los participantes de las transacciones que acaban de expirar; solo debe llamarse tras confirmar el cambio en BD. */
function publicarExpiradas(expiradas: TransaccionExpirada[]): void {
    for (const e of expiradas) {
        if (e.estado_anterior === estadoTransaccion.PENDIENTE) emitirChatCerrado(e.id_transaccion);
        notificacionService.notificar([e.id_usuario_1, e.id_usuario_2], 'EXPIRADA', e.id_transaccion);
    }
}

/**
 * Cancela las transacciones sin respuesta que superaron su plazo (liberando cupo y, en PENDIENTE, el stock reservado).
 * Es idempotente; con `idUsuario` solo revisa las transacciones de ese usuario.
 * Dentro de una transacción de BD hay que pasar `pendientesDePublicar` y llamar a `publicarExpiradas` tras el commit,
 * porque un rollback deshace la expiración; sin él (consulta suelta) se publica de inmediato.
 */
export async function expirarTransaccionesVencidas(
    manager: EntityManager = AppDataSource.manager,
    idUsuario?: number,
    pendientesDePublicar?: TransaccionExpirada[]
): Promise<TransaccionExpirada[]> {
    const filas = filasDe(await manager.query(`
        WITH vencidas AS (
            SELECT id_transaccion, estado::text AS estado_anterior
            FROM transaccion
            WHERE ((estado = '${estadoTransaccion.EN_NEGOCIACION}'
                    AND fecha_estado < NOW() - make_interval(days => $1::int))
                OR (estado = '${estadoTransaccion.PENDIENTE}'
                    AND fecha_estado < NOW() - make_interval(days => $2::int)))
              AND ($3::int IS NULL OR id_usuario_1 = $3::int OR id_usuario_2 = $3::int)
            FOR UPDATE
        )
        UPDATE transaccion t
        SET estado = '${estadoTransaccion.CANCELADA}', fecha_estado = NOW()
        FROM vencidas v
        WHERE t.id_transaccion = v.id_transaccion
        RETURNING t.id_transaccion, t.id_usuario_1, t.id_usuario_2, v.estado_anterior
    `, [LIMITES_TRANSACCION.diasExpiraEnNegociacion, LIMITES_TRANSACCION.diasExpiraPendiente, idUsuario ?? null]));

    const expiradas: TransaccionExpirada[] = filas.map(f => ({
        id_transaccion: Number(f.id_transaccion),
        id_usuario_1: Number(f.id_usuario_1),
        id_usuario_2: Number(f.id_usuario_2),
        estado_anterior: f.estado_anterior as estadoTransaccion
    }));
    if (pendientesDePublicar) {
        pendientesDePublicar.push(...expiradas);
    } else {
        publicarExpiradas(expiradas);
    }
    return expiradas;
}

/**
 * Para el flujo de aceptación (paso a PENDIENTE): ambos usuarios deben tener cupo.
 * Debe llamarse dentro de la transacción que cambia el estado; bloquea a los usuarios en orden de id
 * y con el mismo bloqueo que usa la creación, para no evadir el límite en paralelo.
 */
export async function validarCupoPendientes(
    manager: EntityManager,
    idActual: number,
    idOtro: number,
    pendientesDePublicar?: TransaccionExpirada[]
): Promise<void> {
    const ids = [...new Set([idActual, idOtro])].sort((a, b) => a - b);
    for (const id of ids) {
        await manager.query(`SELECT pg_advisory_xact_lock(-1, $1::int)`, [id]);
    }
    for (const id of ids) {
        await expirarTransaccionesVencidas(manager, id, pendientesDePublicar);
        const [{ pendientes }] = await manager.query(`
            SELECT COUNT(*)::int AS pendientes FROM transaccion
            WHERE estado = '${estadoTransaccion.PENDIENTE}' AND (id_usuario_1 = $1 OR id_usuario_2 = $1)
        `, [id]);
        if (Number(pendientes) >= LIMITES_TRANSACCION.maxPendientes) {
            throw new ConflictError(id === idActual
                ? `Alcanzaste el límite de ${LIMITES_TRANSACCION.maxPendientes} transacciones pendientes`
                : `El otro usuario alcanzó su límite de ${LIMITES_TRANSACCION.maxPendientes} transacciones pendientes`);
        }
    }
}

/** Barrido periódico; el vencimiento también se aplica al consultar o crear transacciones. */
export function iniciarExpiracionTransacciones(): NodeJS.Timeout {
    const ejecutar = () => expirarTransaccionesVencidas().catch(error =>
        console.error('Error al expirar transacciones vencidas:', error));
    void ejecutar();
    const temporizador = setInterval(ejecutar, LIMITES_TRANSACCION.minutosIntervaloExpiracion * 60_000);
    temporizador.unref();
    return temporizador;
}

/** Proyecta la transacción desde el punto de vista de `idUsuario` (rol, contraparte, qué entrega y qué recibe). */
function proyectarTransaccion(t: Transaccion, idUsuario: number) {
    const soyProponente = t.usuario_1.id_usuario === idUsuario;
    const contraparte = soyProponente ? t.usuario_2 : t.usuario_1;
    const miDiferencia = soyProponente ? t.diferencia_a_pagar_1 : t.diferencia_a_pagar_2;
    const suDiferencia = soyProponente ? t.diferencia_a_pagar_2 : t.diferencia_a_pagar_1;

    const cartas = t.detalles_transaccion.map(d => ({
        id_carta_ofrecida: d.id_carta_ofrecida,
        id_tipo_carta: d.carta_ofrecida.tipo_carta.id_tipo_carta,
        nombre_carta: d.carta_ofrecida.tipo_carta.nombre_carta,
        set: d.carta_ofrecida.tipo_carta.set,
        url_imagen: d.carta_ofrecida.tipo_carta.url_imagen,
        url_miniatura: d.carta_ofrecida.tipo_carta.url_miniatura,
        estado: d.carta_ofrecida.estado,
        idioma: d.carta_ofrecida.idioma,
        cantidad: d.cantidad,
        precio_acordado: d.precio_acordado,
        sentido: d.carta_ofrecida.usuario.id_usuario === idUsuario ? 'ENTREGO' as const : 'RECIBO' as const
    }));
    const recibo = cartas.filter(c => c.sentido === 'RECIBO');
    const entrego = cartas.filter(c => c.sentido === 'ENTREGO');
    const valor = (items: typeof cartas) =>
        sumarValor(items.map(c => ({ precio: c.precio_acordado, cantidad: c.cantidad })));

    return {
        id_transaccion: t.id_transaccion,
        estado: t.estado,
        fecha_creacion: t.fecha_creacion,
        fecha_estado: t.fecha_estado,
        mi_turno: t.estado === estadoTransaccion.EN_NEGOCIACION
            && (t.id_usuario_turno ?? t.usuario_2.id_usuario) === idUsuario,
        rol: soyProponente ? 'PROPONENTE' as const : 'DESTINATARIO' as const,
        contraparte: {
            id_usuario: contraparte.id_usuario,
            nombre_usuario: contraparte.nombre_usuario
        },
        resumen: {
            unidades_recibo: recibo.reduce((a, c) => a + c.cantidad, 0),
            unidades_entrego: entrego.reduce((a, c) => a + c.cantidad, 0),
            valor_recibo: valor(recibo),
            valor_entrego: valor(entrego),
            mi_diferencia_a_pagar: miDiferencia,
            diferencia_a_pagar_contraparte: suDiferencia,
            deudor: miDiferencia > 0 ? 'YO' as const : suDiferencia > 0 ? 'CONTRAPARTE' as const : null
        },
        cartas
    };
}

async function validarContraparte(manager: EntityManager, idUsuario: number, idContraparte: number): Promise<void> {
    if (idUsuario === idContraparte) {
        throw new BadRequestError('No puedes realizar una transacción contigo mismo');
    }
    const contraparte = await manager.getRepository(Usuario).findOne({ where: { id_usuario: idContraparte } });
    if (!contraparte || !contraparte.visibilidad_perfil) {
        throw new NotFoundError('Usuario no encontrado');
    }
}

export interface CartaConPrecio {
    id_carta_ofrecida: number;
    cantidad: number;
    precio_ofertado?: number | undefined;
}

export interface DatosContraoferta {
    solicitadas: CartaConPrecio[];
    ofrecidas: CartaConPrecio[];
}

interface DetalleResuelto {
    id_carta_ofrecida: number;
    cantidad: number;
    precio: number;
}

/**
 * Bloquea las cartas involucradas (FOR UPDATE, en orden fijo para evitar deadlocks) y valida propiedad y stock libre.
 * `solicitadas` pertenecen a la contraparte y `ofrecidas` al usuario; el precio de las ofrecidas solo es editable
 * si `precioPropioEditable` (contraofertas), de lo contrario lo fija el servidor.
 */
async function resolverDetalles(manager: EntityManager, p: {
    idUsuario: number;
    idContraparte: number;
    solicitadas: CartaConPrecio[];
    ofrecidas: CartaConPrecio[];
    precioPropioEditable: boolean;
}): Promise<{ solicitadas: DetalleResuelto[]; ofrecidas: DetalleResuelto[] }> {
    const idsCartas = [...p.solicitadas, ...p.ofrecidas].map(c => c.id_carta_ofrecida);
    const filas: any[] = idsCartas.length === 0 ? [] : await manager.query(`
        SELECT o.id_carta_ofrecida, o.id_usuario, o.precio,
               (o.cantidad - COALESCE(r.reservada, 0)) AS stock_disponible
        FROM carta_ofrecida o
        ${SQL_RESERVADO}
        WHERE o.id_carta_ofrecida = ANY($1::int[])
          AND o.fecha_eliminacion IS NULL
        ORDER BY o.id_carta_ofrecida
        FOR UPDATE OF o
    `, [idsCartas]);
    const cartas = new Map<number, CartaBloqueada>(filas.map(f => [Number(f.id_carta_ofrecida), {
        id_carta_ofrecida: Number(f.id_carta_ofrecida),
        id_usuario: Number(f.id_usuario),
        precio: Number(f.precio),
        stock_disponible: Number(f.stock_disponible)
    }]));

    const resolver = (idCarta: number, idDueno: number, cantidad: number): CartaBloqueada => {
        const carta = cartas.get(idCarta);
        if (!carta || carta.id_usuario !== idDueno) {
            throw new NotFoundError(`La carta ${idCarta} no está disponible`);
        }
        if (cantidad > carta.stock_disponible) {
            throw new ConflictError(
                `Stock insuficiente para la carta ${idCarta}: disponible ${carta.stock_disponible}, solicitado ${cantidad}`
            );
        }
        return carta;
    };

    return {
        solicitadas: p.solicitadas.map(s => {
            const carta = resolver(s.id_carta_ofrecida, p.idContraparte, s.cantidad);
            return { id_carta_ofrecida: s.id_carta_ofrecida, cantidad: s.cantidad, precio: s.precio_ofertado ?? carta.precio };
        }),
        ofrecidas: p.ofrecidas.map(o => {
            const carta = resolver(o.id_carta_ofrecida, p.idUsuario, o.cantidad);
            const precio = p.precioPropioEditable ? (o.precio_ofertado ?? carta.precio) : carta.precio;
            return { id_carta_ofrecida: o.id_carta_ofrecida, cantidad: o.cantidad, precio };
        })
    };
}

/** La diferencia siempre se expresa desde usuario_1, sin importar quién escribió la oferta. */
function diferenciaDeOferta(idUsuario1: number, idAutor: number, solicitadas: DetalleResuelto[], ofrecidas: DetalleResuelto[]) {
    const valorSolicitado = sumarValor(solicitadas);
    const valorOfrecido = sumarValor(ofrecidas);
    return idAutor === idUsuario1
        ? calcularDiferencia(valorSolicitado, valorOfrecido)
        : calcularDiferencia(valorOfrecido, valorSolicitado);
}

/** Exige que la transacción esté EN_NEGOCIACION y que sea el turno de `idUsuario` para responder. */
async function leerParaResponder(manager: EntityManager, idUsuario: number, idTransaccion: number, bloquear: boolean) {
    const [fila]: any[] = await manager.query(
        `SELECT id_usuario_1, id_usuario_2, estado, id_usuario_turno FROM transaccion
         WHERE id_transaccion = $1${bloquear ? ' FOR UPDATE' : ''}`,
        [idTransaccion]
    );
    const idUsuario1 = Number(fila?.id_usuario_1);
    const idUsuario2 = Number(fila?.id_usuario_2);
    if (!fila || (idUsuario1 !== idUsuario && idUsuario2 !== idUsuario)) {
        throw new NotFoundError('Transacción no encontrada');
    }
    if (fila.estado !== estadoTransaccion.EN_NEGOCIACION) {
        throw new ConflictError(`La transacción ya está ${fila.estado}`);
    }
    const turno = fila.id_usuario_turno === null ? idUsuario2 : Number(fila.id_usuario_turno);
    if (turno !== idUsuario) {
        throw new ConflictError('Debes esperar la respuesta del otro usuario');
    }
    return { idUsuario1, idOtro: idUsuario1 === idUsuario ? idUsuario2 : idUsuario1 };
}

export const transaccionService = {
    /**
     * Cartas con stock libre de `idDueno`, indicando cuántas unidades de cada una
     * figuran en la lista de deseos de `idDeseante` (mismo criterio de idioma y estado mínimo que el emparejamiento).
     */
    async obtenerInventarioConDeseos(idDueno: number, idDeseante: number) {
        const filas: any[] = await AppDataSource.query(`
            SELECT
                o.id_carta_ofrecida,
                t.id_tipo_carta,
                t.nombre_carta,
                t.rareza,
                t."set",
                t.url_imagen,
                t.url_miniatura,
                f.nombre_franquicia AS franquicia,
                o.estado::text AS estado,
                o.idioma,
                o.precio,
                (o.cantidad - COALESCE(r.reservada, 0)) AS stock_disponible,
                COALESCE(dd.cantidad_deseada, 0) AS cantidad_deseada
            FROM carta_ofrecida o
            JOIN tipo_carta t ON t.id_tipo_carta = o.id_tipo_carta
            JOIN franquicia f ON f.id_franquicia = t.id_franquicia
            ${SQL_RESERVADO}
            LEFT JOIN LATERAL (
                SELECT SUM(d.cantidad)::int AS cantidad_deseada
                FROM carta_deseada d
                WHERE d.id_usuario = $2
                  AND d.id_tipo_carta = o.id_tipo_carta
                  AND d.idioma = o.idioma
                  AND ${calidadSql('o.estado')} >= ${calidadSql('d.estado_minimo')}
            ) dd ON true
            WHERE o.id_usuario = $1
              AND o.fecha_eliminacion IS NULL
              AND (o.cantidad - COALESCE(r.reservada, 0)) > 0
            ORDER BY t.nombre_carta ASC, o.id_carta_ofrecida ASC
        `, [idDueno, idDeseante]);

        return filas.map(f => ({
            id_carta_ofrecida: Number(f.id_carta_ofrecida),
            id_tipo_carta: Number(f.id_tipo_carta),
            nombre_carta: String(f.nombre_carta),
            rareza: String(f.rareza),
            set: String(f.set),
            url_imagen: String(f.url_imagen),
            url_miniatura: String(f.url_miniatura),
            franquicia: String(f.franquicia),
            estado: String(f.estado),
            idioma: String(f.idioma),
            precio: Number(f.precio),
            stock_disponible: Number(f.stock_disponible),
            en_lista_deseos: Number(f.cantidad_deseada) > 0,
            cantidad_deseada: Number(f.cantidad_deseada)
        }));
    },

    /** Inventario de la contraparte elegida en el emparejamiento. */
    async obtenerInventarioContraparte(idUsuario: number, idContraparte: number) {
        await validarContraparte(AppDataSource.manager, idUsuario, idContraparte);
        return transaccionService.obtenerInventarioConDeseos(idContraparte, idUsuario);
    },

    /** Inventario del propio usuario, marcando lo que la contraparte desea. */
    async obtenerMiInventario(idUsuario: number, idContraparte: number) {
        await validarContraparte(AppDataSource.manager, idUsuario, idContraparte);
        return transaccionService.obtenerInventarioConDeseos(idUsuario, idContraparte);
    },

    /** Transacciones del usuario: activas (EN_NEGOCIACION y PENDIENTE) o historial (COMPLETADA, RECHAZADA y CANCELADA). */
    async listarTransacciones(idUsuario: number, opciones: OpcionesListadoTransacciones = {}) {
        await expirarTransaccionesVencidas(AppDataSource.manager, idUsuario);

        const limite = Math.min(opciones.limite ?? 20, 100);
        const offset = opciones.offset ?? 0;
        const estados = opciones.estado ? [opciones.estado] : ESTADOS_POR_VISTA[opciones.vista ?? 'activas'];

        const [transacciones, total] = await AppDataSource.getRepository(Transaccion).findAndCount({
            where: [
                { usuario_1: { id_usuario: idUsuario }, estado: In(estados) },
                { usuario_2: { id_usuario: idUsuario }, estado: In(estados) }
            ],
            relations: RELACIONES_TRANSACCION,
            order: { fecha_creacion: 'DESC', id_transaccion: 'DESC' },
            take: limite,
            skip: offset,
            withDeleted: true
        });

        const noLeidos = await mensajeService.contarNoLeidos(idUsuario, transacciones.map(t => t.id_transaccion));

        return {
            total,
            resultados: transacciones.map(t => {
                const { cartas, ...resto } = proyectarTransaccion(t, idUsuario);
                return { ...resto, mensajes_no_leidos: noLeidos.get(t.id_transaccion) ?? 0 };
            })
        };
    },

    /** Detalle de una transacción; solo la pueden ver sus participantes, sin importar la visibilidad del perfil. */
    async obtenerTransaccion(idUsuario: number, idTransaccion: number) {
        await expirarTransaccionesVencidas(AppDataSource.manager, idUsuario);

        const transaccion = await AppDataSource.getRepository(Transaccion).findOne({
            where: { id_transaccion: idTransaccion },
            relations: RELACIONES_TRANSACCION,
            withDeleted: true
        });
        const esParticipante = transaccion
            && (transaccion.usuario_1.id_usuario === idUsuario || transaccion.usuario_2.id_usuario === idUsuario);
        if (!transaccion || !esParticipante) throw new NotFoundError('Transacción no encontrada');

        const noLeidos = await mensajeService.contarNoLeidos(idUsuario, [idTransaccion]);
        return { ...proyectarTransaccion(transaccion, idUsuario), mensajes_no_leidos: noLeidos.get(idTransaccion) ?? 0 };
    },

    /** Cualquiera de los participantes puede cancelar una transacción EN_NEGOCIACION o PENDIENTE para liberar cupo y stock. */
    async cancelarTransaccion(idUsuario: number, idTransaccion: number) {
        const { resultado, estabaPendiente, idOtro } = await AppDataSource.transaction(async (manager) => {
            const [fila]: any[] = await manager.query(
                `SELECT id_usuario_1, id_usuario_2, estado FROM transaccion WHERE id_transaccion = $1 FOR UPDATE`,
                [idTransaccion]
            );
            if (!fila || (Number(fila.id_usuario_1) !== idUsuario && Number(fila.id_usuario_2) !== idUsuario)) {
                throw new NotFoundError('Transacción no encontrada');
            }
            if (!ESTADOS_POR_VISTA.activas.includes(fila.estado)) {
                throw new ConflictError(`La transacción ya está ${fila.estado}`);
            }

            await manager.query(
                `UPDATE transaccion SET estado = '${estadoTransaccion.CANCELADA}', fecha_estado = NOW() WHERE id_transaccion = $1`,
                [idTransaccion]
            );
            return {
                resultado: { id_transaccion: idTransaccion, estado: estadoTransaccion.CANCELADA },
                estabaPendiente: fila.estado === estadoTransaccion.PENDIENTE,
                idOtro: Number(fila.id_usuario_1) === idUsuario ? Number(fila.id_usuario_2) : Number(fila.id_usuario_1)
            };
        });
        // Se avisa después del commit para que el chat no se cierre si la transacción se revierte
        if (estabaPendiente) emitirChatCerrado(idTransaccion);
        notificacionService.notificar([idOtro], 'CANCELADA', idTransaccion, idUsuario);
        return resultado;
    },

    /** Reemplaza la oferta vigente por una nueva y pasa el turno al otro usuario. No renueva el plazo de expiración. */
    async contraofertar(idUsuario: number, idTransaccion: number, datos: DatosContraoferta) {
        if (datos.solicitadas.length + datos.ofrecidas.length === 0) {
            throw new BadRequestError('La contraoferta debe incluir al menos una carta');
        }

        const expiradas: TransaccionExpirada[] = [];
        const resultado = await AppDataSource.transaction(async (manager) => {
            await expirarTransaccionesVencidas(manager, idUsuario, expiradas);
            const { idUsuario1, idOtro } = await leerParaResponder(manager, idUsuario, idTransaccion, true);

            const { solicitadas, ofrecidas } = await resolverDetalles(manager, {
                idUsuario,
                idContraparte: idOtro,
                solicitadas: datos.solicitadas,
                ofrecidas: datos.ofrecidas,
                precioPropioEditable: true
            });
            const diferencias = diferenciaDeOferta(idUsuario1, idUsuario, solicitadas, ofrecidas);

            await manager.delete(DetalleTransaccion, { id_transaccion: idTransaccion });
            await manager.insert(DetalleTransaccion, [...solicitadas, ...ofrecidas].map(d => ({
                id_transaccion: idTransaccion,
                id_carta_ofrecida: d.id_carta_ofrecida,
                precio_acordado: d.precio,
                cantidad: d.cantidad
            })));
            await manager.update(Transaccion, { id_transaccion: idTransaccion }, {
                ...diferencias,
                id_usuario_turno: idOtro
            });

            return {
                id_transaccion: idTransaccion,
                estado: estadoTransaccion.EN_NEGOCIACION,
                id_usuario_turno: idOtro,
                ...diferencias
            };
        });
        publicarExpiradas(expiradas);
        notificacionService.notificar([resultado.id_usuario_turno], 'CONTRAOFERTA', idTransaccion, idUsuario);
        return resultado;
    },

    /** EN_NEGOCIACION -> PENDIENTE; revalida cupo y stock porque la negociación no reserva cartas. */
    async aceptarTransaccion(idUsuario: number, idTransaccion: number) {
        const expiradas: TransaccionExpirada[] = [];
        const { resultado, idOtro } = await AppDataSource.transaction(async (manager) => {
            await expirarTransaccionesVencidas(manager, idUsuario, expiradas);
            const { idOtro } = await leerParaResponder(manager, idUsuario, idTransaccion, false);

            // Bloqueos por usuario antes que el de la fila, igual que en la creación
            await validarCupoPendientes(manager, idUsuario, idOtro, expiradas);
            await leerParaResponder(manager, idUsuario, idTransaccion, true);

            const disponibles: any[] = await manager.query(`
                SELECT dt.id_carta_ofrecida, dt.cantidad,
                       (o.cantidad - COALESCE(r.reservada, 0)) AS stock_disponible
                FROM detalle_transaccion dt
                JOIN carta_ofrecida o ON o.id_carta_ofrecida = dt.id_carta_ofrecida
                                     AND o.fecha_eliminacion IS NULL
                ${SQL_RESERVADO}
                WHERE dt.id_transaccion = $1
                ORDER BY o.id_carta_ofrecida
                FOR UPDATE OF o
            `, [idTransaccion]);
            const [{ total }] = await manager.query(
                `SELECT COUNT(*)::int AS total FROM detalle_transaccion WHERE id_transaccion = $1`,
                [idTransaccion]
            );
            if (disponibles.length !== Number(total)) {
                throw new ConflictError('Alguna de las cartas de la oferta ya no está disponible');
            }
            for (const d of disponibles) {
                if (Number(d.cantidad) > Number(d.stock_disponible)) {
                    throw new ConflictError(
                        `Stock insuficiente para la carta ${d.id_carta_ofrecida}: disponible ${Math.max(Number(d.stock_disponible), 0)}, en la oferta ${d.cantidad}`
                    );
                }
            }

            await manager.query(
                `UPDATE transaccion
                 SET estado = '${estadoTransaccion.PENDIENTE}', fecha_estado = NOW(), id_usuario_turno = NULL
                 WHERE id_transaccion = $1`,
                [idTransaccion]
            );
            return { resultado: { id_transaccion: idTransaccion, estado: estadoTransaccion.PENDIENTE }, idOtro };
        });
        publicarExpiradas(expiradas);
        notificacionService.notificar([idOtro], 'ACEPTADA', idTransaccion, idUsuario);
        return resultado;
    },

    async rechazarTransaccion(idUsuario: number, idTransaccion: number) {
        const expiradas: TransaccionExpirada[] = [];
        const { resultado, idOtro } = await AppDataSource.transaction(async (manager) => {
            await expirarTransaccionesVencidas(manager, idUsuario, expiradas);
            const { idOtro } = await leerParaResponder(manager, idUsuario, idTransaccion, true);

            await manager.query(
                `UPDATE transaccion
                 SET estado = '${estadoTransaccion.RECHAZADA}', fecha_estado = NOW(), id_usuario_turno = NULL
                 WHERE id_transaccion = $1`,
                [idTransaccion]
            );
            return { resultado: { id_transaccion: idTransaccion, estado: estadoTransaccion.RECHAZADA }, idOtro };
        });
        publicarExpiradas(expiradas);
        notificacionService.notificar([idOtro], 'RECHAZADA', idTransaccion, idUsuario);
        return resultado;
    },

    async crearTransaccion(idUsuario: number, datos: DatosCrearTransaccion) {
        const idDestino = datos.id_usuario_destino;
        const solicitadas = datos.solicitadas;
        const ofrecidas = datos.ofrecidas ?? [];

        const expiradas: TransaccionExpirada[] = [];
        const resultado = await AppDataSource.transaction(async (manager) => {
            await validarContraparte(manager, idUsuario, idDestino);

            // Serializa las propuestas del mismo usuario para que el límite no se evada en paralelo.
            // El namespace negativo no choca con el bloqueo por par (ids positivos) de más abajo.
            await manager.query(`SELECT pg_advisory_xact_lock(-1, $1::int)`, [idUsuario]);
            await expirarTransaccionesVencidas(manager, idUsuario, expiradas);

            const [{ enviadas }] = await manager.query(`
                SELECT COUNT(*)::int AS enviadas FROM transaccion
                WHERE id_usuario_1 = $1 AND estado = '${estadoTransaccion.EN_NEGOCIACION}'
            `, [idUsuario]);
            if (Number(enviadas) >= LIMITES_TRANSACCION.maxEnNegociacionEnviadas) {
                throw new ConflictError(
                    `Alcanzaste el límite de ${LIMITES_TRANSACCION.maxEnNegociacionEnviadas} propuestas en negociación. Cancela alguna antes de crear otra`
                );
            }

            // Serializa propuestas simultáneas entre el mismo par de usuarios
            await manager.query(
                `SELECT pg_advisory_xact_lock(LEAST($1::int, $2::int), GREATEST($1::int, $2::int))`,
                [idUsuario, idDestino]
            );

            const activa: any[] = await manager.query(`
                SELECT 1 FROM transaccion
                WHERE estado IN (${ESTADOS_ACTIVOS_SQL})
                  AND ((id_usuario_1 = $1 AND id_usuario_2 = $2)
                    OR (id_usuario_1 = $2 AND id_usuario_2 = $1))
                LIMIT 1
            `, [idUsuario, idDestino]);
            if (activa.length > 0) {
                throw new ConflictError('Ya existe una transacción en curso con este usuario');
            }

            const { solicitadas: detallesSolicitados, ofrecidas: detallesOfrecidos } = await resolverDetalles(manager, {
                idUsuario,
                idContraparte: idDestino,
                solicitadas,
                ofrecidas,
                precioPropioEditable: false
            });

            const diferencias = calcularDiferencia(
                sumarValor(detallesSolicitados),
                sumarValor(detallesOfrecidos)
            );

            const transaccion = await manager.save(manager.create(Transaccion, {
                usuario_1: { id_usuario: idUsuario },
                usuario_2: { id_usuario: idDestino },
                estado: estadoTransaccion.EN_NEGOCIACION,
                id_usuario_turno: idDestino,
                ...diferencias
            }));

            const detalles = [...detallesSolicitados, ...detallesOfrecidos].map(d => ({
                id_transaccion: transaccion.id_transaccion,
                id_carta_ofrecida: d.id_carta_ofrecida,
                precio_acordado: d.precio,
                cantidad: d.cantidad
            }));
            await manager.insert(DetalleTransaccion, detalles);

            const deudor = diferencias.diferencia_a_pagar_1 > 0 ? idUsuario
                : diferencias.diferencia_a_pagar_2 > 0 ? idDestino
                : null;

            return {
                id_transaccion: transaccion.id_transaccion,
                id_usuario_1: idUsuario,
                id_usuario_2: idDestino,
                estado: transaccion.estado,
                fecha_creacion: transaccion.fecha_creacion,
                ...diferencias,
                deudor,
                solicitadas: detallesSolicitados.map(d => ({
                    id_carta_ofrecida: d.id_carta_ofrecida, cantidad: d.cantidad, precio_acordado: d.precio
                })),
                ofrecidas: detallesOfrecidos.map(d => ({
                    id_carta_ofrecida: d.id_carta_ofrecida, cantidad: d.cantidad, precio_acordado: d.precio
                }))
            };
        });
        publicarExpiradas(expiradas);
        notificacionService.notificar([idDestino], 'NUEVA_PROPUESTA', resultado.id_transaccion, idUsuario);
        return resultado;
    }
};
