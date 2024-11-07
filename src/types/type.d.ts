// src/types/express.d.ts
import express from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: { userId: number };
            body?: {
                user?: { userId: number };
                // другие поля вашего body
            };
        }
    }
}
