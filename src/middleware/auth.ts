import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const ADM_SECRET = process.env.ADM_SECRET!;


// Middleware для проверки JWT-токена
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Необходима авторизация' });
        return; // добавьте return, чтобы избежать дальнейшего выполнения
    }

    const token = authHeader.split(' ')[1]; // Извлекаем токен из заголовка Authorization

    try {
        // Проверяем и декодируем токен
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

        // Добавляем ID пользователя в объект запроса для использования в маршрутах
        req.body.user = { userId: decoded.userId, role: decoded.userId === parseInt(ADM_SECRET, 10) ? 'admin' : 'user'};

        next(); // Передаем управление следующему middleware
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Токен истек, пожалуйста, войдите снова' });
            return;
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error('Неверный токен:', token); // Логируем только для отладки
            res.status(403).json({ error: 'Неверный или просроченный токен' });
            return;
        } else {
            console.error('Ошибка верификации токена:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
            return;
        }
    }
};
