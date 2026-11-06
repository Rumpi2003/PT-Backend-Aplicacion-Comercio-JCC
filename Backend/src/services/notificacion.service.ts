import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { AppDataSource } from '../config/db.config.js';

export type TipoNotificacion =
    | 'NUEVA_PROPUESTA'
    | 'CONTRAOFERTA'
    | 'ACEPTADA'
    | 'RECHAZADA'
    | 'CANCELADA'
    | 'EXPIRADA'
    | 'CONFIRMACION'
    | 'COMPLETADA'
    | 'MENSAJE';

const TEXTOS: Record<TipoNotificacion, (actor: string) => { titulo: string; cuerpo: string }> = {
    NUEVA_PROPUESTA: (actor) => ({ titulo: 'Nueva propuesta', cuerpo: `${actor} te envió una propuesta de intercambio` }),
    CONTRAOFERTA: (actor) => ({ titulo: 'Nueva contraoferta', cuerpo: `${actor} respondió con una contraoferta` }),
    ACEPTADA: (actor) => ({ titulo: 'Propuesta aceptada', cuerpo: `${actor} aceptó el intercambio. Coordinen la entrega por el chat` }),
    RECHAZADA: (actor) => ({ titulo: 'Propuesta rechazada', cuerpo: `${actor} rechazó la propuesta` }),
    CANCELADA: (actor) => ({ titulo: 'Transacción cancelada', cuerpo: `${actor} canceló la transacción` }),
    EXPIRADA: () => ({ titulo: 'Transacción expirada', cuerpo: 'La transacción venció por falta de respuesta' }),
    CONFIRMACION: (actor) => ({ titulo: 'Confirma la entrega', cuerpo: `${actor} confirmó el intercambio. Confirma tú para completar la transacción` }),
    COMPLETADA: (actor) => ({ titulo: 'Transacción completada', cuerpo: `Completaste el intercambio con ${actor}. Puedes dejarle una reseña` }),
    // El contenido del mensaje no se incluye para no exponerlo en la pantalla de bloqueo
    MENSAJE: (actor) => ({ titulo: 'Nuevo mensaje', cuerpo: `Nuevo mensaje de ${actor}` })
};

// Los canales deben crearse en la app Android con estos mismos ids
const CANAL_ANDROID: Record<TipoNotificacion, string> = {
    NUEVA_PROPUESTA: 'transacciones',
    CONTRAOFERTA: 'transacciones',
    ACEPTADA: 'transacciones',
    RECHAZADA: 'transacciones',
    CANCELADA: 'transacciones',
    EXPIRADA: 'transacciones',
    CONFIRMACION: 'transacciones',
    COMPLETADA: 'transacciones',
    MENSAJE: 'mensajes'
};

const TOKENS_INVALIDOS = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token'
]);
const MAX_TOKENS_POR_ENVIO = 500;

let app: App | null = null;
let intentoInicializar = false;

/** La cuenta de servicio de Firebase llega como JSON o en base64 por FIREBASE_SERVICE_ACCOUNT; sin ella el push queda desactivado. */
function obtenerMessaging(): Messaging | null {
    if (!intentoInicializar) {
        intentoInicializar = true;
        const bruto = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
        if (!bruto) {
            console.warn('FIREBASE_SERVICE_ACCOUNT no está definida: las notificaciones push están desactivadas');
        } else {
            try {
                const json = bruto.startsWith('{') ? bruto : Buffer.from(bruto, 'base64').toString('utf8');
                app = initializeApp({ credential: cert(JSON.parse(json)) });
            } catch (error) {
                console.error('No se pudo inicializar Firebase, las notificaciones push quedan desactivadas:', error);
            }
        }
    }
    return app ? getMessaging(app) : null;
}

async function enviar(idsUsuario: number[], tipo: TipoNotificacion, idTransaccion: number, actor: string): Promise<void> {
    const messaging = obtenerMessaging();
    if (!messaging || idsUsuario.length === 0) return;

    const filas: { token: string }[] = await AppDataSource.query(
        `SELECT token FROM dispositivo_push WHERE id_usuario = ANY($1::int[])`,
        [idsUsuario]
    );
    const tokens = filas.map(f => f.token);
    if (tokens.length === 0) return;

    const { titulo, cuerpo } = TEXTOS[tipo](actor);
    const invalidos: string[] = [];

    for (let i = 0; i < tokens.length; i += MAX_TOKENS_POR_ENVIO) {
        const lote = tokens.slice(i, i + MAX_TOKENS_POR_ENVIO);
        const respuesta = await messaging.sendEachForMulticast({
            tokens: lote,
            notification: { title: titulo, body: cuerpo },
            data: { tipo, id_transaccion: String(idTransaccion) },
            android: {
                priority: 'high',
                notification: {
                    channelId: CANAL_ANDROID[tipo],
                    // Los mensajes de una misma transacción se reemplazan entre sí en la bandeja
                    ...(tipo === 'MENSAJE' ? { tag: `chat:${idTransaccion}` } : {})
                }
            }
        });
        respuesta.responses.forEach((r, idx) => {
            if (!r.success && r.error && TOKENS_INVALIDOS.has(r.error.code)) invalidos.push(lote[idx]!);
        });
    }

    if (invalidos.length > 0) {
        await AppDataSource.query(`DELETE FROM dispositivo_push WHERE token = ANY($1::text[])`, [invalidos]);
    }
}

export const notificacionService = {
    /** Inicializa Firebase al arrancar para detectar pronto una configuración ausente o inválida. */
    iniciar(): void {
        obtenerMessaging();
    },

    /** Registra el token de FCM; si ya existía para otra cuenta (mismo dispositivo) pasa a pertenecer a esta. */
    async registrarDispositivo(idUsuario: number, token: string): Promise<void> {
        await AppDataSource.query(
            `INSERT INTO dispositivo_push (id_usuario, token) VALUES ($1, $2)
             ON CONFLICT (token) DO UPDATE SET id_usuario = EXCLUDED.id_usuario, fecha_registro = NOW()`,
            [idUsuario, token]
        );
    },

    /** Se usa al cerrar sesión; solo elimina el token si pertenece al usuario autenticado. */
    async eliminarDispositivo(idUsuario: number, token: string): Promise<void> {
        await AppDataSource.query(
            `DELETE FROM dispositivo_push WHERE token = $1 AND id_usuario = $2`,
            [token, idUsuario]
        );
    },

    /**
     * Envía el push en segundo plano: nunca lanza ni se espera, para que una caída de FCM no afecte la operación de negocio.
     * `idActor` es quien originó el evento (su nombre aparece en el texto); puede omitirse en eventos del sistema.
     */
    notificar(destinatarios: number[], tipo: TipoNotificacion, idTransaccion: number, idActor?: number): void {
        void (async () => {
            const ids = [...new Set(destinatarios)];
            let actor = '';
            if (idActor !== undefined) {
                const [fila] = await AppDataSource.query(`SELECT nombre_usuario FROM usuario WHERE id_usuario = $1`, [idActor]);
                actor = fila?.nombre_usuario ?? 'Un usuario';
            }
            await enviar(ids, tipo, idTransaccion, actor);
        })().catch(error => console.error(`Error al enviar la notificación ${tipo}:`, error));
    }
};
