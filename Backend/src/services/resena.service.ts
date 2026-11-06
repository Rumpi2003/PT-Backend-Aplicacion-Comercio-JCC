import { AppDataSource } from '../config/db.config.js';
import { BadRequestError, ConflictError, NotFoundError } from '../handlers/errorHandlers.js';
import { filasDe } from '../utils/db.js';

export interface DatosResena {
    puntuacion: number;
    cuerpo?: string | undefined;
}

export interface ResenaPropia {
    puntuacion: number;
    cuerpo: string;
    fecha_creacion: string;
}

export const resenaService = {
    /**
     * Crea o edita la reseña de `idResenador` hacia `idResenado` (una por par de usuarios) y recalcula el promedio.
     * Exige haber completado al menos una transacción juntos, lo que impide reseñas sin intercambio real.
     */
    async guardar(idResenador: number, idResenado: number, datos: DatosResena) {
        if (idResenador === idResenado) {
            throw new BadRequestError('No puedes reseñarte a ti mismo');
        }

        return AppDataSource.transaction(async (manager) => {
            // Bloquear al reseñado serializa las reseñas simultáneas y evita que el promedio quede desactualizado
            const [usuario] = filasDe(await manager.query(
                `SELECT id_usuario FROM usuario WHERE id_usuario = $1 FOR UPDATE`,
                [idResenado]
            ));
            if (!usuario) throw new NotFoundError('Usuario no encontrado');

            const completada = await manager.query(
                `SELECT 1 FROM transaccion
                 WHERE estado = 'COMPLETADA'
                   AND ((id_usuario_1 = $1 AND id_usuario_2 = $2) OR (id_usuario_1 = $2 AND id_usuario_2 = $1))
                 LIMIT 1`,
                [idResenador, idResenado]
            );
            if (completada.length === 0) {
                throw new ConflictError('Solo puedes reseñar a usuarios con los que completaste una transacción');
            }

            const [reseña] = filasDe(await manager.query(
                `INSERT INTO "reseña" ("id_usuario_reseñador", "id_usuario_reseñado", cuerpo, puntuacion)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT ("id_usuario_reseñador", "id_usuario_reseñado")
                 DO UPDATE SET cuerpo = EXCLUDED.cuerpo, puntuacion = EXCLUDED.puntuacion
                 RETURNING cuerpo, puntuacion, fecha_creacion, (xmax = 0) AS creada`,
                [idResenador, idResenado, datos.cuerpo ?? '', datos.puntuacion]
            ));

            const [resumen] = filasDe(await manager.query(
                `UPDATE usuario
                 SET puntuacion_promedio = (SELECT ROUND(AVG(puntuacion)::numeric, 2) FROM "reseña" WHERE "id_usuario_reseñado" = $1)
                 WHERE id_usuario = $1
                 RETURNING puntuacion_promedio, (SELECT COUNT(*)::int FROM "reseña" WHERE "id_usuario_reseñado" = $1) AS total_resenas`,
                [idResenado]
            ));

            return {
                id_usuario_resenado: idResenado,
                puntuacion: Number(reseña.puntuacion),
                cuerpo: String(reseña.cuerpo),
                fecha_creacion: new Date(reseña.fecha_creacion).toISOString(),
                editada: !reseña.creada,
                puntuacion_promedio: Number(resumen.puntuacion_promedio),
                total_resenas: Number(resumen.total_resenas)
            };
        });
    },

    /** Reseñas que `idResenador` dejó a cada usuario de `idsResenado`; los que no tienen reseña no aparecen. */
    async obtenerMias(idResenador: number, idsResenado: number[]): Promise<Map<number, ResenaPropia>> {
        if (idsResenado.length === 0) return new Map();
        const filas: any[] = await AppDataSource.query(
            `SELECT "id_usuario_reseñado" AS id, puntuacion, cuerpo, fecha_creacion FROM "reseña"
             WHERE "id_usuario_reseñador" = $1 AND "id_usuario_reseñado" = ANY($2::int[])`,
            [idResenador, idsResenado]
        );
        return new Map(filas.map(f => [Number(f.id), {
            puntuacion: Number(f.puntuacion),
            cuerpo: String(f.cuerpo),
            fecha_creacion: new Date(f.fecha_creacion).toISOString()
        }]));
    },

    /** Reseña propia hacia un usuario para precargar el formulario de edición; `null` si aún no existe. */
    async obtenerMia(idResenador: number, idResenado: number): Promise<ResenaPropia | null> {
        const mapa = await resenaService.obtenerMias(idResenador, [idResenado]);
        return mapa.get(idResenado) ?? null;
    },

    /** Reseñas recibidas por un usuario, de la más reciente a la más antigua. Siempre públicas, sin importar `visibilidad_perfil`. */
    async listarRecibidas(idUsuario: number, limite = 20, offset = 0) {
        const [existe] = await AppDataSource.query(`SELECT 1 FROM usuario WHERE id_usuario = $1`, [idUsuario]);
        if (!existe) throw new NotFoundError('Usuario no encontrado');

        const [{ total }] = await AppDataSource.query(
            `SELECT COUNT(*)::int AS total FROM "reseña" WHERE "id_usuario_reseñado" = $1`,
            [idUsuario]
        );
        const filas: any[] = await AppDataSource.query(
            `SELECT r."id_usuario_reseñador" AS id_autor, u.nombre_usuario, r.puntuacion, r.cuerpo, r.fecha_creacion
             FROM "reseña" r
             JOIN usuario u ON u.id_usuario = r."id_usuario_reseñador"
             WHERE r."id_usuario_reseñado" = $1
             ORDER BY r.fecha_creacion DESC, r."id_usuario_reseñador" DESC
             LIMIT $2 OFFSET $3`,
            [idUsuario, Math.min(limite, 100), offset]
        );

        return {
            total: Number(total),
            resultados: filas.map(f => ({
                autor: { id_usuario: Number(f.id_autor), nombre_usuario: String(f.nombre_usuario) },
                puntuacion: Number(f.puntuacion),
                cuerpo: String(f.cuerpo),
                fecha_creacion: new Date(f.fecha_creacion).toISOString()
            }))
        };
    }
};
