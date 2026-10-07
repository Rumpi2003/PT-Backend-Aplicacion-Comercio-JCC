import { tcgApiPool, tcgApiHeaders, tcgApiBasePath } from '../config/tcgApi.config.js'
import { ExternalApiError } from '../handlers/errorHandlers.js'
import type { CartaExternaRespuestaDTO, CartaExternaDTO, CartaExterna, CartaExternaPaginada } from '../types/cartaExterna.types.js'
import type { SetExternoRespuestaDTO, SetExternoDTO, SetExterno, SetExternoListado } from '../types/setExterno.types.js'
import type { TcgExternoRespuestaDTO, TcgExternoDTO, TcgExterno } from '../types/tcgExterno.types.js'

type BuscarCartasInput = {
    nombre: string;
    tcg_id?: string;
    set_id?: string;
    sortBy?: string;
    sortOrder?: string;
    limite?: number;
    pagina?: number;
};

function mapearTcg(dto: TcgExternoDTO): TcgExterno {
    return {
        id: dto._id,
        nombre_tcg: dto.name
    };
}

function mapearSet(dto: SetExternoDTO): SetExterno {
    return {
        id: dto._id,
        nombre_set: dto.name
    };
}

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
    listarTcgs: async (): Promise<TcgExterno[]> => {
        let statusCode: number;
        let body: any;

        try {
            const response = await tcgApiPool.request({
                path: `${tcgApiBasePath}/tcgs?sortBy=name&sortOrder=asc`,
                method: 'GET',
                headers: tcgApiHeaders
            });
            statusCode = response.statusCode;
            body = await response.body.json() as TcgExternoRespuestaDTO;
        } catch (error: any) {
            throw new ExternalApiError(`Error al comunicarse con la API externa: ${error.message}`);
        }

        if (statusCode !== 200) {
            throw new ExternalApiError(`Error en la API externa: ${statusCode}`);
        }

        return body.data.map(mapearTcg);
    },

    listarSets: async (tcg: string, sortBy: string = 'release_date', sortOrder: string = 'desc'): Promise<SetExternoListado> => {
        const query = new URLSearchParams({
            sortBy: sortBy,
            sortOrder: sortOrder
        });
        let statusCode: number;
        let body: any;

        try {
            const response = await tcgApiPool.request({
                path: `${tcgApiBasePath}/${tcg}/sets?${query.toString()}`,
                method: 'GET',
                headers: tcgApiHeaders
            });
            statusCode = response.statusCode;
            body = await response.body.json() as SetExternoRespuestaDTO;
        } catch (error: any) {
            throw new ExternalApiError(`Error al comunicarse con la API externa: ${error.message}`);
        }

        if (statusCode !== 200) {
            throw new ExternalApiError(`Error en la API externa: ${statusCode}`);
        }

        return {
            resultados: body.data.map(mapearSet),
            total: body.total
        }
    },

    buscarCartas: async ({ nombre, tcg_id, set_id, sortBy, sortOrder, pagina = 1, limite = 10}: BuscarCartasInput): Promise<CartaExternaPaginada> => {
        const query = new URLSearchParams({
            tcg: tcg_id ?? '',
            set: set_id ?? '',
            name: nombre,
            sortBy: sortBy ?? 'name',
            sortOrder: sortOrder ?? 'asc',
            limit: String(limite),
            page: String(pagina)
        });

        let statusCode: number;
        let body: any;

        try {
            const response = await tcgApiPool.request({
                path: `${tcgApiBasePath}/products?type=card&${query.toString()}`,
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
};