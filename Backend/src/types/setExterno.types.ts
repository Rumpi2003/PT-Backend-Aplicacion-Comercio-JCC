export type SetExternoDTO = {
    _id: string;
    name: string;
    tcg: string;
    code: string;
};

export type SetExternoRespuestaDTO = {
    success: boolean;
    data: SetExternoDTO[];
    total: number;
};

export type SetExterno = {
    id: string;
    nombre_set: string;
};

export type SetExternoListado = {
    resultados: SetExterno[];
    total: number;
};