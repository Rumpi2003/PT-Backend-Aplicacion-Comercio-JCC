import { type Response } from 'express';

export function sendSuccess(
    res: Response,
    data: unknown,
    message = 'Success',
    statusCode = 200
): void {
    res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
}

export function sendError(
    res: Response,
    message = 'Error interno del servidor',
    errors: unknown[] = [],
    statusCode = 500,
): void {
    res.status(statusCode).json({
        status: 'error',
        message: Array.isArray(message) ? message : [message],
        errors
    });
}