import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Токен не предоставлен' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Проверяем, что у пользователя роль 'admin'
        if (decoded.role !== 'admin') {
            res.status(403).json({ error: 'Доступ запрещен. Требуется роль администратора.' });
            return;
        }

        next(); // Роль 'admin' подтверждена, продолжаем выполнение запроса
    } catch (error) {
        res.status(403).json({ error: 'Неверный или просроченный токен' });
    }
};

export default isAdmin;
