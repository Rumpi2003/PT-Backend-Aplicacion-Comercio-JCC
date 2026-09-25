import { AppDataSource } from "../config/db.config.js"
import { Usuario } from "../entities/usuario.entity.js"
import { Comuna } from "../entities/comuna.entity.js"

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
    }
}