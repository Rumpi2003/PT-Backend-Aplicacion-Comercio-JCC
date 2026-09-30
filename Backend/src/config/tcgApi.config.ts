import { Pool } from 'undici';

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Variable de entorno ${name} no definida`);
    return value;
}

const tcgApiUrl = new URL(getEnvVar('TCG_API_URL'));

export const tcgApiBasePath = tcgApiUrl.pathname;

export const tcgApiPool = new Pool(tcgApiUrl.origin, {
    connections: 10,
    pipelining: 1,
    keepAliveTimeout: 10_000,
    headersTimeout: 5_000,
    bodyTimeout: 5_000,
});

export const tcgApiHeaders = {
    'x-api-key': getEnvVar('TCG_API_KEY')
}