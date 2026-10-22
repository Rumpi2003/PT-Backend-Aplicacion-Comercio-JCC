import { AppDataSource } from '../config/db.config.js';
import { TipoCarta } from '../entities/tipoCarta.entity.js';
import { Franquicia } from '../entities/franquicia.entity.js';
import { tcgApiService } from './tcgApi.service.js';
import { CartaOfrecida, type Estado } from '../entities/cartaOfrecida.entity.js';
import { CartaDeseada, EstadoMin } from '../entities/cartaDeseada.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { Not } from 'typeorm';
import { NotFoundError, ConflictError } from '../handlers/errorHandlers.js'

export type SortBy = 'nombre_carta' | 'precio' | 'franquicia';
export type SortOrder = 'ASC' | 'DESC';

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
            throw new NotFoundError(`Franquicia no sembrada: ${carta.franquicia}`);
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

        const formatear = (c: CartaOfrecida) => ({
            id_carta_ofrecida: c.id_carta_ofrecida,
            id_tipo_carta: tipoCarta.id_tipo_carta,
            estado: c.estado,
            idioma: c.idioma,
            precio: c.precio,
            cantidad: c.cantidad
        });

        const existente = await repo.findOne({
            where: {
                usuario: { id_usuario: idUsuario },
                tipo_carta: { id_tipo_carta: tipoCarta.id_tipo_carta },
                idioma: datos.idioma,
                estado: datos.estado
            },
            withDeleted: true
        });

        if (existente) {
            if (existente.fecha_eliminacion) {
                existente.fecha_eliminacion = null;
                existente.cantidad = datos.cantidad ?? 1;
                existente.precio = datos.precio;
                return formatear(await repo.save(existente));
            }
            if ((existente.cantidad + (datos.cantidad ?? 1)) > 999) {
                throw new ConflictError('La cantidad no puede exceder los 999');
            }
            existente.cantidad += datos.cantidad ?? 1;
            existente.precio = datos.precio ?? existente.precio;
            return formatear(await repo.save(existente));
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
        return formatear(guardada);
    },

    agregarCartaDeseada: async (idUsuario: number, datos: {
        id_tipo_carta: number; estado_minimo: EstadoMin; idioma: string; cantidad?: number;
    }) => {
        const tipoCarta = await inventarioService.obtenerOCrear(datos.id_tipo_carta);
        const repo = AppDataSource.getRepository(CartaDeseada);
        const formatear = (c: CartaDeseada) => ({
            id_carta_deseada: c.id_carta_deseada,
            id_tipo_carta: tipoCarta.id_tipo_carta,
            estado_minimo: c.estado_minimo,
            idioma: c.idioma,
            cantidad: c.cantidad
        });

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
                throw new ConflictError('La cantidad no puede exceder los 999');
            }
            existente.cantidad += datos.cantidad ?? 1;
            return formatear(await repo.save(existente));
        }

        const nueva = repo.create({
            usuario: { id_usuario: idUsuario } as Usuario,
            tipo_carta: tipoCarta,
            estado_minimo: datos.estado_minimo,
            idioma: datos.idioma,
            cantidad: datos.cantidad ?? 1
        });
        const guardada = await repo.save(nueva);
        return formatear(guardada);
    },

    obtenerInventario: async (idUsuario: number, sortBy: SortBy = 'nombre_carta', sortOrder: SortOrder = 'ASC') => {
        const repo = AppDataSource.getRepository(CartaOfrecida);
        const order =
            sortBy === 'precio' ? { precio: sortOrder }
            : sortBy === 'franquicia' ? { tipo_carta: { franquicia: { nombre_franquicia: sortOrder } } }
            : { tipo_carta: { [sortBy]: sortOrder } };
        const cartas = await repo.find({
            where: { usuario: { id_usuario: idUsuario } },
            relations: { tipo_carta: { franquicia: true } },
            order: order
        });

        return cartas.map(carta => ({
            id_carta_ofrecida: carta.id_carta_ofrecida,
            id_tipo_carta: carta.tipo_carta.id_tipo_carta,
            nombre_carta: carta.tipo_carta.nombre_carta,
            rareza: carta.tipo_carta.rareza,
            set: carta.tipo_carta.set,
            url_imagen: carta.tipo_carta.url_imagen,
            url_miniatura: carta.tipo_carta.url_miniatura,
            franquicia: carta.tipo_carta.franquicia.nombre_franquicia,
            estado: carta.estado,
            idioma: carta.idioma,
            precio: carta.precio,
            cantidad: carta.cantidad
        }));
    },

    obtenerListaDeseos: async (idUsuario: number, sortBy: Exclude<SortBy, 'precio'> = 'nombre_carta', sortOrder: SortOrder = 'ASC') => {
        const repo = AppDataSource.getRepository(CartaDeseada);
        const order = sortBy === 'franquicia'
            ? { tipo_carta: { franquicia: { nombre_franquicia: sortOrder } } }
            : { tipo_carta: { nombre_carta: sortOrder } };
        const cartas = await repo.find({
            where: { usuario: { id_usuario: idUsuario } },
            relations: { tipo_carta: { franquicia: true } },
            order: order
        });

        return cartas.map(carta => ({
            id_carta_deseada: carta.id_carta_deseada,
            id_tipo_carta: carta.tipo_carta.id_tipo_carta,
            nombre_carta: carta.tipo_carta.nombre_carta,
            rareza: carta.tipo_carta.rareza,
            set: carta.tipo_carta.set,
            url_imagen: carta.tipo_carta.url_imagen,
            url_miniatura: carta.tipo_carta.url_miniatura,
            franquicia: carta.tipo_carta.franquicia.nombre_franquicia,
            estado_minimo: carta.estado_minimo,
            idioma: carta.idioma,
            cantidad: carta.cantidad
        }));
    },

    modificarCartaOfrecida: async (
        idUsuario: number,
        idCartaOfrecida: number,
        datos: { estado?: Estado, idioma?: string, precio?: number, cantidad?: number }
    ) => {
        const repo = AppDataSource.getRepository(CartaOfrecida);
        const carta = await repo.findOne({
             where: { id_carta_ofrecida: idCartaOfrecida, usuario: { id_usuario: idUsuario } },
             relations: { tipo_carta: true, detalles_transaccion: true }
        });
        if (!carta) throw new NotFoundError('Carta ofrecida no encontrada');
    
        const nuevoEstado = datos.estado ?? carta.estado;
        const nuevoIdioma = datos.idioma ?? carta.idioma;
        const nuevaCantidad = datos.cantidad ?? carta.cantidad;
        const nuevoPrecio = datos.precio ?? carta.precio;

        if (nuevoEstado !== carta.estado || nuevoIdioma !== carta.idioma) {
            const duplicada = await repo.findOne({
                where: {
                    usuario: { id_usuario: idUsuario },
                    tipo_carta: { id_tipo_carta: carta.tipo_carta.id_tipo_carta },
                    estado: nuevoEstado,
                    idioma: nuevoIdioma,
                    id_carta_ofrecida: Not(idCartaOfrecida),
                },
                withDeleted: true
            });
            if (duplicada) {
                if (!duplicada.fecha_eliminacion) {
                    throw new ConflictError('Ya existe una carta ofrecida con el mismo estado e idioma');
                }
                await AppDataSource.transaction(async (manager) => {
                    if (carta.detalles_transaccion.length > 0) {
                        await manager.softRemove(carta);
                    } else {
                        await manager.remove(carta);
                    }
                    duplicada.fecha_eliminacion = null;
                    duplicada.cantidad = nuevaCantidad;
                    duplicada.precio = nuevoPrecio;
                    await manager.save(duplicada);
                });
                return {
                    id_carta_ofrecida: duplicada.id_carta_ofrecida,
                    id_tipo_carta: carta.tipo_carta.id_tipo_carta,
                    estado: duplicada.estado,
                    idioma: duplicada.idioma,
                    precio: duplicada.precio,
                    cantidad: duplicada.cantidad
                };
            }
        }

        carta.estado = nuevoEstado;
        carta.idioma = nuevoIdioma;
        carta.cantidad = nuevaCantidad;
        carta.precio = nuevoPrecio;
        await repo.save(carta);
        return {
            id_carta_ofrecida: carta.id_carta_ofrecida,
            id_tipo_carta: carta.tipo_carta.id_tipo_carta,
            estado: carta.estado,
            idioma: carta.idioma,
            precio: carta.precio,
            cantidad: carta.cantidad
        }
    },

    eliminarCartaOfrecida: async (idUsuario: number, idCartaOfrecida: number) => {
        const repo = AppDataSource.getRepository(CartaOfrecida);
        const carta = await repo.findOne({
            where: { id_carta_ofrecida: idCartaOfrecida, usuario: { id_usuario: idUsuario } },
            relations: { detalles_transaccion: true }
        });
        if (!carta) {
            throw new NotFoundError('Carta ofrecida no encontrada');
        }

        if (carta.detalles_transaccion.length > 0) {
            await repo.softRemove(carta);
        } else {
            await repo.remove(carta);
        }
    },

    modificarCartaDeseada: async (
        idUsuario: number,
        idCartaDeseada: number,
        datos: { estado_minimo?: EstadoMin, idioma?: string, cantidad?: number }
    ) => {
        const repo = AppDataSource.getRepository(CartaDeseada);
        const carta = await repo.findOne({
            where: { id_carta_deseada: idCartaDeseada, usuario: { id_usuario: idUsuario } },
            relations: { tipo_carta: true }
        });
        if (!carta) throw new NotFoundError('Carta deseada no encontrada');

        const nuevoEstado = datos.estado_minimo ?? carta.estado_minimo;
        const nuevoIdioma = datos.idioma ?? carta.idioma;
        const nuevaCantidad = datos.cantidad ?? carta.cantidad;

        if (nuevoEstado !== carta.estado_minimo || nuevoIdioma !== carta.idioma) {
            const duplicada = await repo.findOne({
                where: {
                    usuario: { id_usuario: idUsuario },
                    tipo_carta: { id_tipo_carta: carta.tipo_carta.id_tipo_carta },
                    estado_minimo: nuevoEstado,
                    idioma: nuevoIdioma,
                    id_carta_deseada: Not(idCartaDeseada)
                }
            });
            if (duplicada) {
                throw new ConflictError('Ya existe una carta deseada con el mismo estado mínimo e idioma');
            }
        }

        carta.estado_minimo = nuevoEstado;
        carta.idioma = nuevoIdioma;
        carta.cantidad = nuevaCantidad;
        await repo.save(carta);
        return {
            id_carta_deseada: carta.id_carta_deseada,
            id_tipo_carta: carta.tipo_carta.id_tipo_carta,
            estado_minimo: carta.estado_minimo,
            idioma: carta.idioma,
            cantidad: carta.cantidad
        };
    },

    eliminarCartaDeseada: async (idUsuario: number, idCartaDeseada: number) => {
        const repo = AppDataSource.getRepository(CartaDeseada);
        const carta = await repo.findOne({
            where: { id_carta_deseada: idCartaDeseada, usuario: { id_usuario: idUsuario } }
        });
        if (!carta) throw new NotFoundError('Carta deseada no encontrada');
        await repo.remove(carta);
    }

};