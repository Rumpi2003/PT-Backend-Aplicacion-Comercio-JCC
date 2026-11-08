import 'dotenv/config';

const entero = (nombre: string, porDefecto: number): number => {
    const valor = Number(process.env[nombre]);
    return Number.isInteger(valor) && valor > 0 ? valor : porDefecto;
};

export const LIMITES_TRANSACCION = {
    // Propuestas EN_NEGOCIACION que un usuario puede tener enviadas; las recibidas no se limitan
    maxEnNegociacionEnviadas: entero('TX_MAX_EN_NEGOCIACION_ENVIADAS', 10),
    // PENDIENTES (aceptadas por ambos) en las que un usuario participa, sin importar su rol
    maxPendientes: entero('TX_MAX_PENDIENTES', 5),
    diasExpiraEnNegociacion: entero('TX_DIAS_EXPIRA_EN_NEGOCIACION', 7),
    diasExpiraPendiente: entero('TX_DIAS_EXPIRA_PENDIENTE', 14),
    minutosIntervaloExpiracion: entero('TX_MINUTOS_INTERVALO_EXPIRACION', 60)
} as const;

// Cupos por usuario: cuentan filas activas (una por carta, estado e idioma)
export const LIMITES_COLECCION = {
    maxListaDeseos: entero('MAX_LISTA_DESEOS', 50),
    maxInventarioCartas: entero('MAX_INVENTARIO_CARTAS', 250)
} as const;
