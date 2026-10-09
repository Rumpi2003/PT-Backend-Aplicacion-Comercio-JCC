import { AppDataSource } from '../config/db.config.js';
import { TipoCarta } from '../entities/tipoCarta.entity.js';
import { Franquicia } from '../entities/franquicia.entity.js';
import { tcgApiService } from './tcgApi.service.js';
import { CartaOfrecida, type Estado } from '../entities/cartaOfrecida.entity.js';
import { CartaDeseada, EstadoMin } from '../entities/cartaDeseada.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';

export const inventarioService = {
    obtenerOCrear: async (idExterno: number): Promise<TipoCarta> => {
        const tipoCartaRepo = AppDataSource.getRepository(TipoCarta);

        const existente = await tipoCartaRepo.findOne({ where: { id_tipo_carta: idExterno } });
        if (existente) return existente;

        const carta = await tcgApiService.obtenerCartaPorId(idExterno);

        const franquiciaRepo = AppDataSource.getRepository(Franquicia);
        
        let franquicia = await franquiciaRepo.findOne({
            where: { nombre_franquicia: carta.franquicia }
        });

        if (!franquicia) {
            throw new Error(`Franquicia no sembrada: ${carta.franquicia}`);
        }

        const nueva = tipoCartaRepo.create({
            id_tipo_carta: carta.id,   
            nombre_carta: carta.nombre_carta,
            rareza: carta.rareza,
            set: carta.set,
            url_imagen: carta.url_imagen,
            url_miniatura: carta.url_miniatura,
            franquicia
        });

        return await tipoCartaRepo.save(nueva);
    },

    agregarCartaOfrecida: async (idUsuario: number, datos: {
        id_tipo_carta: number; estado: Estado; idioma: string; precio: number; cantidad?: number;
    }) => {
        const tipoCarta = await inventarioService.obtenerOCrear(datos.id_tipo_carta);
        const repo = AppDataSource.getRepository(CartaOfrecida);

        const existente = await repo.findOne({
            where: {
                usuario: { id_usuario: idUsuario },
                tipo_carta: { id_tipo_carta: tipoCarta.id_tipo_carta },
                idioma: datos.idioma,
                estado: datos.estado
            }
        });

        if (existente) {
            if ((existente.cantidad + (datos.cantidad ?? 1)) > 999) {
                throw new Error('La cantidad no puede exceder los 999');
            }
            existente.cantidad += datos.cantidad ?? 1;
            existente.precio = datos.precio ?? existente.precio;
            return await repo.save(existente);
        }

        const nueva = repo.create({
            usuario: { id_usuario: idUsuario } as Usuario,
            tipo_carta: tipoCarta,
            estado: datos.estado,
            idioma: datos.idioma,
            precio: datos.precio,
            cantidad: datos.cantidad ?? 1
        });
        const guardada = await repo.save(nueva);
        return {
            id_carta_ofrecida: guardada.id_carta_ofrecida,
            id_tipo_carta: guardada.tipo_carta.id_tipo_carta,
            estado: guardada.estado,
            idioma: guardada.idioma,
            precio: guardada.precio,
            cantidad: guardada.cantidad
        }
    },

    agregarCartaDeseada: async (idUsuario: number, datos: {
        id_tipo_carta: number; estado_minimo: EstadoMin; idioma: string; cantidad?: number;
    }) => {
        const tipoCarta = await inventarioService.obtenerOCrear(datos.id_tipo_carta);
        const repo = AppDataSource.getRepository(CartaDeseada);

        const existente = await repo.findOne({
            where: {
                usuario: { id_usuario: idUsuario },
                tipo_carta: { id_tipo_carta: tipoCarta.id_tipo_carta },
                idioma: datos.idioma,
                estado_minimo: datos.estado_minimo
            }
        });

        if (existente) {
            if ((existente.cantidad + (datos.cantidad ?? 1)) > 999) {
                throw new Error('La cantidad no puede exceder los 999');
            }
            existente.cantidad += datos.cantidad ?? 1;
            return await repo.save(existente);
        }

        const nueva = repo.create({
            usuario: { id_usuario: idUsuario } as Usuario,
            tipo_carta: tipoCarta,
            estado_minimo: datos.estado_minimo,
            idioma: datos.idioma,
            cantidad: datos.cantidad ?? 1
        });
        const guardada = await repo.save(nueva);
        return {
            id_carta_deseada: guardada.id_carta_deseada,
            id_tipo_carta: guardada.tipo_carta.id_tipo_carta,
            estado_minimo: guardada.estado_minimo,
            idioma: guardada.idioma,
            cantidad: guardada.cantidad
        };
    }
};