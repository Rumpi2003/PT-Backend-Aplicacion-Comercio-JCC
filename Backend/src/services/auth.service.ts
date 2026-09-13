import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/db.config.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Comuna } from '../entities/comuna.entity.js';
import { ConflictError, CredentialError } from '../handlers/errorHandlers.js';

type RegisterInput = {
    correo: string;
    contraseña: string;
    nombre_usuario: string;
    descripcion_perfil?: string;
    contacto?: string;
    id_comuna: number;
};

type LoginInput = {
    correo: string;
    contraseña: string;
};

export const authService = {
    register: async ({ correo, contraseña, nombre_usuario, descripcion_perfil, contacto, id_comuna }: RegisterInput) => {
        if (!correo || !contraseña || !nombre_usuario || !id_comuna) {
            throw new Error('Faltan campos obligatorios');
        }

        const correoNormalizado = correo.trim().toLowerCase();
        
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const comunaRepo = AppDataSource.getRepository(Comuna);

        const correoExistente = await usuarioRepo.findOne({
            where: { correo: correoNormalizado }
        });

        // Validacion 1°: Se verifica que el correo no este registrado
        if (correoExistente) {
            throw new ConflictError('El correo ya está en uso');
        }

        const nombreExistente = await usuarioRepo.findOne({
            where: { nombre_usuario }
        });

        // Validacion 2°: Se verifica que el nombre de usuario no exista
        if (nombreExistente) {
            throw new ConflictError('El nombre de usuario ya está en uso');
        }

        const comuna = await comunaRepo.findOne({
            where: { id_comuna }
        });

        // Validacion 3°: Se verifica que el id de la comuna exista (mensaje de error para desarrollo)
        if (!comuna) {
            throw new Error('La comuna no existe');
        }
        
        // Validacion 4°: Se verifica que el contacto no esté en uso
        if (contacto) {
            contacto = contacto.trim();
            const contactoExistente = await usuarioRepo.findOne({
                where: { contacto }
            });

            if (contactoExistente) {
                throw new ConflictError('El contacto ya está en uso');
            }
        }

        const passwordHash = await bcrypt.hash(contraseña, 10);

        const nuevoUsuario = usuarioRepo.create({
            correo: correoNormalizado,
            contraseña: passwordHash,
            nombre_usuario,
            descripcion_perfil: descripcion_perfil ?? '',
            contacto: contacto || null,
            comuna
        });

        const usuarioGuardado = await usuarioRepo.save(nuevoUsuario);

        const token = jwt.sign(
            {
                id: usuarioGuardado.id_usuario,
                correo: usuarioGuardado.correo
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        return {
            token,
            usuario: {
                id_usuario: usuarioGuardado.id_usuario,
                correo: usuarioGuardado.correo,
                nombre_usuario: usuarioGuardado.nombre_usuario
            }
        };

    },

    login: async ({ correo, contraseña }: LoginInput) => {
        if (!correo || !contraseña) {
            throw new CredentialError('Correo y contraseña son obligatorios');
        }

        const correoNormalizado = correo.trim().toLowerCase();

        const usuario = await AppDataSource.getRepository(Usuario).findOne({
            where: { correo: correoNormalizado }
        });

        if (!usuario) {
            throw new CredentialError('El correo no está registrado');
        }

        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!contraseñaValida) {
            throw new CredentialError('La contraseña es incorrecta');
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        return {
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                nombre_usuario: usuario.nombre_usuario
            }
        };
    }
};