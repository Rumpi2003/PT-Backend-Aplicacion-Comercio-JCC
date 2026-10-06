import { AppDataSource } from '../config/db.config.js';
import { TipoCarta } from '../entities/tipoCarta.entity.js';
import { Franquicia } from '../entities/franquicia.entity.js';
import { tcgApiService } from './tcgApi.service.js';

/**export const tipoCartaService = {
    obtenerOCrearDesdeExterna: async (idExterno: number) => {
        const tipoCartaRepo = AppDataSource.getRepository(TipoCarta);

        const existente = await tipoCartaRepo.findOne({ where: { id_tipo_carta: idExterno } });
        if (existente) return existente;

        const carta = await tcgApiService.obtenerPorId(idExterno);

        const franquicia = await AppDataSource.getRepository(Franquicia).findOne({
            where: { nombre_franquicia: carta.tcg.name }
        });
        if (!franquicia) {
            throw new Error(`Franquicia no sembrada: ${carta.tcg.name}`);
        }

        const nueva = tipoCartaRepo.create({
            id_tipo_carta: carta._id,
            nombre_carta: carta.name,
            rareza: carta.attributes.Rarity ?? '',
            set: carta.set.name,
            url_imagen: carta.images[0]?.large ?? '',
            url_miniatura: carta.images[0]?.small ?? '',
            franquicia
        });

        return await tipoCartaRepo.save(nueva);
    }
};*/