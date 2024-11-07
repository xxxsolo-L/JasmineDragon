/*
import {Router, Request, Response} from 'express';
import {prisma, Prisma} from "../../server";

const router = Router();

router.route('/categories')
    .post(async (req: Request, res: Response): Promise<void> => {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        try {
            const newCategoryData:Partial<Prisma.CategoryCreateInput> {
                name,
                // Поля updatedAt и createdAt не указываем, Prisma заполнит их автоматически
            };

            const newCategory = await prisma.category.create({
                data: newCategoryData,
            });
            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    })
    .get(async (req: Request, res: Response) => {

    })

export default router;
*/
