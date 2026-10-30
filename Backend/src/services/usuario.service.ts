import { AppDataSource } from "../config/db.config.js"
import { Usuario } from "../entities/usuario.entity.js"
import { Comuna } from "../entities/comuna.entity.js"
import { NotFoundError, ConflictError } from "../handlers/errorHandlers.js"

export const usuarioService = {
    getPerfilPersonal: async (id: number) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id },
            relations: { comuna: true }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const perfil = {
            comuna: usuario.comuna,
            correo: usuario.correo,
            nombre_usuario: usuario.nombre_usuario,
            descripcion_perfil: usuario.descripcion_perfil,
            contacto: usuario.contacto,
            puntuacion_promedio: usuario.puntuacion_promedio,
            radio_geo: usuario.radio_geo,
            visibilidad_perfil: usuario.visibilidad_perfil,
            fecha_registro: usuario.fecha_registro,
        };

        return perfil;
    },

    updateDescripcion: async (id: number, descripcion: string) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        usuario.descripcion_perfil = descripcion;
        await repo.save(usuario);
        return {
            descripcion_perfil: usuario.descripcion_perfil
        };
    },

    updateComuna: async (id: number, id_comuna: number) => {
        const repo = AppDataSource.getRepository(Usuario);
        const comunaRepo = AppDataSource.getRepository(Comuna);

        const comuna = await comunaRepo.findOne({
            where: { id_comuna: id_comuna }
        });

        if (!comuna) {
            throw new Error('Comuna no encontrada');
        }

        const usuario = await repo.findOne({
            where: { id_usuario: id }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        usuario.comuna = comuna;
        await repo.save(usuario);
        return comuna;
    },

    updateRadioGeo: async (id: number, radio_geo: number) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        usuario.radio_geo = radio_geo;
        await repo.save(usuario);
        return {
            radio_geo: usuario.radio_geo
        };
    },

    updateVisibilidadPerfil: async (id: number, visibilidad_perfil: boolean) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        usuario.visibilidad_perfil = visibilidad_perfil;
        await repo.save(usuario);
        return {
            visibilidad_perfil: usuario.visibilidad_perfil
        };
    },

    updateModoGeo: async (id: number, modo_geo_activado: boolean) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        usuario.modo_geo_activado = modo_geo_activado;
        if (!modo_geo_activado) {
            usuario.ultimas_coordenadas = null;
            usuario.ultima_update_geo = null;
        }
        await repo.save(usuario);
        return {
            modo_geo_activado: usuario.modo_geo_activado
        };
    },

    getModoGeo: async (id: number) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id },
            select: { id_usuario: true, modo_geo_activado: true }
        });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        return {
            modo_geo_activado: usuario.modo_geo_activado
        };
    },

    updateUbicacion: async (id: number, latitud: number, longitud: number) => {
        const repo = AppDataSource.getRepository(Usuario);
        const usuario = await repo.findOne({
            where: { id_usuario: id },
            select: { id_usuario: true, modo_geo_activado: true }
        });

        if (!usuario) {
            throw new NotFoundError('Usuario no encontrado');
        }

        if (!usuario.modo_geo_activado) {
            throw new ConflictError('Debes activar el modo geolocalizado para actualizar tu ubicación');
        }

        await repo.query(
            `UPDATE usuario
             SET ultimas_coordenadas = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                 ultima_update_geo = NOW()
             WHERE id_usuario = $3`,
            [longitud, latitud, id]
        );

        return { latitud, longitud };
    }


}