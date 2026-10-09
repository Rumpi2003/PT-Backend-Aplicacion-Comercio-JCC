import { AppDataSource } from "../config/db.config.js";
import { Franquicia } from "../entities/franquicia.entity.js";
import { tcgApiService } from "../services/tcgApi.service.js";

export async function seedFranquicias() {
    const franquiciaRepository = AppDataSource.getRepository(Franquicia);

    const count = await franquiciaRepository.count();
    if (count > 0) {
        console.log('Franquicias ya sembradas, se omite el seeding.');
        return;
    }

    const tcgs = await tcgApiService.listarTcgs();

    for (const tcg of tcgs) {
        const existente = await franquiciaRepository.findOneBy({ id_franquicia: tcg.id });
        if (!existente) {
            const nueva = franquiciaRepository.create({ id_franquicia: tcg.id, nombre_franquicia: tcg.nombre_tcg });
            await franquiciaRepository.save(nueva);
            console.log(`Franquicia ${tcg.nombre_tcg} creada.`);
        }
    }
}