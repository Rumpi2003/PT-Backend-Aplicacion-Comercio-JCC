export type CartaExternaImagenDTO = {
    small: string;
    medium: string;
    large: string;
};

export type CartaExternaSetDTO = {
    _id: string;
    name: string;
    tcg: string;
    code: string;
};

export type CartaExternaTcgDTO = {
    _id: string;
    name: string;
};

export type CartaExternaAttributesDTO = {
    Rarity?: string;
    [key: string]: string | undefined;
};


export type CartaExternaDTO = {
    _id: number;
    name: string;
    tcg: CartaExternaTcgDTO;
    set: CartaExternaSetDTO;
    images: CartaExternaImagenDTO[];
    attributes: CartaExternaAttributesDTO;
};

export type CartaExternaRespuestaDTO = {
    success: boolean;
    data: CartaExternaDTO[];
    total: number;
};

// --- Tipos normalizados

export type CartaExterna = {
    id: number;
    nombre_carta: string;
    rareza: string;
    set: string;
    url_imagen: string;
    url_miniatura: string;
    franquicia: string;
};

export type CartaExternaPaginada = {
    resultados: CartaExterna[];
    limite: number;
    pagina: number;
    total: number;
};