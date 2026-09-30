import { tcgApiPool, tcgApiHeaders, tcgApiBasePath } from '../config/tcgApi.config.js'
import { ExternalApiError } from '../handlers/errorHandlers.js'
import type { CartaExternaRespuestaDTO, CartaExternaDTO, CartaExterna, CartaExternaPaginada } from '../types/cartaExterna.types.js'

type BuscarCartasInput = {
    nombre: string;
    limite?: number;
    pagina?: number;
};

function mapearCarta(dto: CartaExternaDTO): CartaExterna {
    return {
        id: dto._id,
        nombre_carta: dto.name,
        rareza: dto.attributes.Rarity ?? '',
        set: dto.set.name,
        url_imagen: dto.images[0]?.large ?? '',
        url_miniatura: dto.images[0]?.small ?? '',
        franquicia: dto.tcg.name
    };
}

export const tcgApiService = {
    buscarCartas: async ({ nombre, pagina = 1, limite = 10}: BuscarCartasInput): Promise<CartaExternaPaginada> => {
        const query = new URLSearchParams({
            name: nombre,
            limit: String(limite),
            page: String(pagina)
        });

        let statusCode: number;
        let body: any;

        try {
            const response = await tcgApiPool.request({
                path: `${tcgApiBasePath}?tcg=pokemon&type=card&${query.toString()}`,
                method: 'GET',
                headers: tcgApiHeaders
            });
            statusCode = response.statusCode;
            body = await response.body.json() as CartaExternaRespuestaDTO;
        } catch (error: any) {
            throw new ExternalApiError(`Error al comunicarse con la API externa: ${error.message}`);
        }

        if (statusCode !== 200) {
            throw new ExternalApiError(`Error en la API externa: ${statusCode}`);
        }

        return {
            resultados: body.data.map(mapearCarta),
            limite: limite,
            pagina: pagina,
            total: body.total
        };
    },

        obtenerPorId: async (idExterno: number): Promise<CartaExternaDTO> => {
        let statusCode: number;
        let body: any;

        try {
            const response = await tcgApiPool.request({
                path: `${tcgApiBasePath}/cards/${idExterno}`, // cambiar
                method: 'GET',
                headers: tcgApiHeaders
            });
            statusCode = response.statusCode;
            body = await response.body.json();
        } catch (error: any) {
            throw new ExternalApiError(`No se pudo contactar la API externa de cartas: ${error.message}`);
        }

        if (statusCode === 404) {
            throw new Error(`Carta externa no encontrada: ${idExterno}`);
        }
        if (statusCode >= 400 || !body.success) {
            throw new ExternalApiError(`La API externa respondió con estado ${statusCode}`);
        }

        return body.data as CartaExternaDTO;
    }
};