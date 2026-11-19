import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/db.config.js';

// Uso: docker exec -e ADMIN_CORREO=... -e ADMIN_CONTRASENA=... ptjcc_backend_dev npm run crear-admin
// Si el correo ya existe solo se promueve a ADMIN y se levanta su suspensión; su contraseña no cambia.
const correo = process.env.ADMIN_CORREO?.trim().toLowerCase();
const contraseña = process.env.ADMIN_CONTRASENA;
const nombreUsuario = process.env.ADMIN_NOMBRE_USUARIO?.trim() || 'administrador';

async function main() {
    if (!correo || !contraseña) {
        throw new Error('Define ADMIN_CORREO y ADMIN_CONTRASENA');
    }
    if (contraseña.length < 8 || contraseña.length > 64) {
        throw new Error('ADMIN_CONTRASENA debe tener entre 8 y 64 caracteres');
    }

    await AppDataSource.initialize();

    try {
        const [existente] = await AppDataSource.query(
            `SELECT id_usuario FROM usuario WHERE correo = $1`,
            [correo]
        );

        if (existente) {
            await AppDataSource.query(
                `UPDATE usuario SET rol = 'ADMIN', suspendido = false WHERE id_usuario = $1`,
                [existente.id_usuario]
            );
            console.log(`Usuario ${correo} promovido a ADMIN (id ${existente.id_usuario})`);
            return;
        }

        const [comuna] = await AppDataSource.query(`SELECT id_comuna FROM comuna ORDER BY id_comuna LIMIT 1`);
        if (!comuna) {
            throw new Error('No hay comunas cargadas; inicia el servidor una vez para ejecutar los seeds');
        }

        const passwordHash = await bcrypt.hash(contraseña, 10);
        const [nuevo] = await AppDataSource.query(
            `INSERT INTO usuario (correo, "contraseña", nombre_usuario, descripcion_perfil, id_comuna, rol)
             VALUES ($1, $2, $3, '', $4, 'ADMIN')
             RETURNING id_usuario`,
            [correo, passwordHash, nombreUsuario, comuna.id_comuna]
        );
        console.log(`Administrador ${correo} creado (id ${nuevo.id_usuario})`);
    } finally {
        await AppDataSource.destroy();
    }
}

main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
});
