/**
 * En PostgreSQL, TypeORM devuelve `[filas, cantidadAfectada]` para UPDATE/DELETE ... RETURNING
 * y solo las filas para un SELECT; esto normaliza ambos casos.
 */
export function filasDe<T = any>(resultado: unknown): T[] {
    if (Array.isArray(resultado) && Array.isArray(resultado[0]) && typeof resultado[1] === 'number') {
        return resultado[0] as T[];
    }
    return resultado as T[];
}
