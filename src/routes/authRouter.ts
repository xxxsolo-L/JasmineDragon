import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {prisma, Prisma} from "../../server";

const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const ADM_SECRET = process.env.ADM_SECRET!;

// Регистрация
authRouter.route('/register')
    .post(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        // Проверка существования пользователя
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: "Пользователь с таким email уже существует" });
            return;
        }
        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        // Создание нового пользователя
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });
        // Создание JWT-токена
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '1h' }  // срок действия токена
        );
        // Ответ с токеном
        res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
    } catch (error) {
        res.status(500).json({ error: "Ошибка регистрации пользователя" });
    }
});

// Вход в систему
authRouter.route('/login')
    .post( async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;

        try {
            // Проверка существования пользователя, аутентификация
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                res.status(401).json({ error: 'Неверный логин или пароль.' });
                return;
            }

            // Проверка пароля
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ error: 'Неверный логин или пароль.' });
                return;
            }

            // Создание JWT-токена, авторизация
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.id === parseInt(ADM_SECRET, 10) ? 'admin' : 'user' // Указываем роль в зависимости от ID
                },
                JWT_SECRET,
                { expiresIn: '1h' } // Время жизни токена
            );

            // Ответ с токеном и данными пользователя
             res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.id === parseInt(ADM_SECRET, 10) ? 'admin' : 'user', name: user.name || ''} });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Ошибка входа. Пожалуйста, попробуйте позже.' });
        }});



export default authRouter;
