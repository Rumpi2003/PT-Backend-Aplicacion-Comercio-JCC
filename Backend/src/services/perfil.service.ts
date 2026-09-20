import { AppDataSource } from "../config/db.config.js"
import { Usuario } from "../entities/usuario.entity.js"

export const perfilService = {
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
            nombre: usuario.nombre_usuario,
            descripcion_perfil: usuario.descripcion_perfil,
            contacto: usuario.contacto,
            puntuacion_promedio: usuario.puntuacion_promedio,
            radio_geo: usuario.radio_geo,
            visibilidad_perfil: usuario.visibilidad_perfil,
            fecha_registro: usuario.fecha_registro,
        };

        return perfil;
    }
}