import { AppDataSource } from '../config/db.config.js';
import { Franquicia } from '../entities/franquicia.entity.js';
import type { TcgExterno } from '../types/tcgExterno.types.js';

export const franquiciaService = {
    listarFranquicias: async (): Promise<TcgExterno[]> => {
        const repo = AppDataSource.getRepository(Franquicia);
        const franquicias = await repo.find({
            order: { nombre_franquicia: 'ASC' }
        });

        return franquicias.map(f => ({
            id: f.id_franquicia,
            nombre_tcg: f.nombre_franquicia
        }));
    }
};