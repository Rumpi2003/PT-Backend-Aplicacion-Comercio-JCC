export class CredentialError extends Error {
    statusCode = 401;

    constructor(message: string) {
        super(message);
        this.name = 'CredentialError';
    }
}

export class NotFoundError extends Error {
    statusCode = 404;

    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends Error {
    statusCode = 409;

    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

export class ExternalApiError extends Error {
    statusCode = 502;

    constructor(message: string) {
        super(message);
        this.name = 'ExternalApiError';
    }
}
