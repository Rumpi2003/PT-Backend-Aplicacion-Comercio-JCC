export class ConflictError extends Error {
    statusCode = 409;

    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

export class CredentialError extends Error {
    statusCode = 401;

    constructor(message: string) {
        super(message);
        this.name = 'CredentialError';
    }
}