import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import generateOrderNumber from '../utils/generateOrderNumber';
import jwt from 'jsonwebtoken';
import isAdmin from '../middleware/isAdmin';

const orderRouter = express.Router();
const prisma = new PrismaClient();

interface OrderItemType {
    productId: number;
    quantity: number;
}

orderRouter.post('/order', verifyToken, async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body.user || {};
    const { address, orderItems }: { address: string; orderItems: OrderItemType[] } = req.body;

    if (!userId) {
        res.status(400).json({ error: 'Необходимо указать идентификатор пользователя.(авторизоваться)' });
        return;
    }

    try {
        let total = 0;

        // Получаем информацию о товарах для расчета общей стоимости
        const productIds = orderItems.map(item => item.productId);
        const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

        // Создаем объект для быстрого доступа к продуктам
        const productMap = products.reduce<Record<number, { price: string }>>((acc, product) => {
            acc[product.id] = product; // Исправлено присваивание
            return acc;
        }, {});

        // Проходим по каждому элементу заказа и считаем общую стоимость
        for (const item of orderItems) {
            const product = productMap[item.productId]; // Используем map для доступа к продукту
            if (!product) {
                res.status(404).json({ error: `Товар с ID ${item.productId} не найден` });
                return;
            }
            total += parseFloat(product.price) * item.quantity; // Убедитесь, что price — это строка
        }

        const newOrder = await prisma.order.create({
            data: {
                userId,
                total,
                status: 'pending',
                address,
                orderNumber: generateOrderNumber(),
                OrderItem: {
                    create: orderItems.map((item: OrderItemType) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: parseFloat(productMap[item.productId].price), // Используем price как число
                    })),
                },
            },
            include: { OrderItem: true }
        });

        res.status(201).json({ message: 'Заказ успешно создан', order: newOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка создания заказа' });
    }
});

orderRouter.get('/orders', verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                OrderItem: true,
                User: { select: { id: true, email: true, name: true } }
            }
        });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
});

orderRouter.patch('/orders/:orderId/status', verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const { status }: { status: string } = req.body;

    if (!status) {
        res.status(400).json({ error: 'Необходимо указать новый статус заказа' });
        return;
    }

    try {
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status },
        });

        res.status(200).json({ message: 'Статус заказа успешно обновлен', order: updatedOrder });
    } catch (error) {
        console.error('Ошибка при обновлении статуса заказа:', error);
        res.status(500).json({ error: 'Ошибка при обновлении статуса заказа' });
    }
});

// Получить заказ по ID
orderRouter.get('/orders/:orderId', verifyToken, async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const { userId, role } = req.body.user || {}; // Проверка с деструктуризацией

    console.log('User role and ID:', role, userId); // Проверяем, что role и userId приходят корректно

    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                OrderItem: true,
                User: { select: { id: true, email: true, name: true } }
            }
        });

        if (!order) {
            res.status(404).json({ error: 'Заказ не найден' });
            return;
        }

        // Если роль 'admin', даём доступ без дальнейших проверок
        if (role === 'admin') {
            res.status(200).json(order);
            return;
        }

        // Проверка для обычного пользователя: доступ только к своим заказам
        if (order.userId !== userId) {
            console.log(`Доступ запрещен. Роль пользователя: ${role}`);
            res.status(403).json({ error: 'Доступ запрещен. Вы можете просматривать только свои заказы.' });
            return;
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Ошибка при получении заказа:', error);
        res.status(500).json({ error: 'Ошибка при получении заказа' });
    }
});

// Удалить заказ по ID (только для администратора)
orderRouter.delete('/orders/:orderId', verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    try {
        const deletedOrder = await prisma.order.delete({
            where: { id: parseInt(orderId) },
        });

        res.status(200).json({ message: 'Заказ успешно удален', order: deletedOrder });
    } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
        res.status(500).json({ error: 'Ошибка при удалении заказа' });
    }
});

export default orderRouter;
