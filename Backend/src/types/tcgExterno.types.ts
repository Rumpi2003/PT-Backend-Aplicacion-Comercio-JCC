export type TcgExternoDTO = {
    _id: string;
    name: string;
    description?: string;
    logo?: string;
};

export type TcgExternoRespuestaDTO = {
    success: boolean;
    data: TcgExternoDTO[];
    total: number;
};

export type TcgExterno = {
    id: string;
    nombre_tcg: string;
};