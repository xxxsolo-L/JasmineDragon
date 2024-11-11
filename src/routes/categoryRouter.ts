import {Router, Request, Response} from 'express';
import {prisma, Prisma} from "../../server";
import {verifyToken} from "../middleware/auth";
import isAdmin from "../middleware/isAdmin";

const router = Router();

router.route('/categories')
    .post(verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        try {
            const newCategoryData: Prisma.CategoryCreateInput = {
                name: name as string,
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

    .get(async (req: Request, res: Response): Promise<void> => {
        try {
            const categories = await prisma.category.findMany();  // Получаем все категории
            res.status(200).json(categories);  // Отправляем категории в ответе
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    })

    .put(verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
        const { currentName, newName } = req.body;

        // Проверка, что оба значения переданы
        if (!currentName || !newName) {
            res.status(400).json({ error: 'Both currentName and newName are required' });
            return;
        }

        try {
            // Проверяем, существует ли категория с текущим именем
            const category = await prisma.category.findUnique({
                where: { name: currentName },
            });

            // Если категория не найдена, возвращаем 404
            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }

            // Обновляем название категории
            const updatedCategory = await prisma.category.update({
                where: { name: currentName },
                data: { name: newName },
            });

            res.status(200).json(updatedCategory);
        } catch (error) {
            console.error('Error updating category name:', error);
            res.status(500).json({ error: 'Failed to update category name' });
        }
    })

    .delete(verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        try {
            // Проверяем, существует ли категория с таким именем
            const category = await prisma.category.findUnique({
                where: {
                    name: name,
                },
            });

            // Если категория не найдена, возвращаем ошибку 404
            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }

            // Устанавливаем `categoryId` продуктов в `NULL` перед удалением категории
            await prisma.product.updateMany({
                where: { categoryId: category.id },
                data: { categoryId: 0 },
            });

            // Удаляем категорию по имени
            await prisma.category.delete({
                where: {
                    name: name,
                },
            });

            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    });

router.route('/categories/:categoryId/subcategories')
    .post(verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
        const { categoryId } = req.params;
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Subcategory name is required' });
            return;
        }

        try {
            const newSubCategory = await prisma.subCategory.create({
                data: {
                    name,
                    categoryId: Number(categoryId),
                },
            });
            res.status(201).json(newSubCategory);
        } catch (error) {
            console.error('Error creating subcategory:', error);
            res.status(500).json({ error: 'Failed to create subcategory' });
        }
    })

    .get(async (req: Request, res: Response): Promise<void> => {
    const { categoryId } = req.params;

    try {
        const subCategories = await prisma.subCategory.findMany({
            where: { categoryId: Number(categoryId) },
        });
        res.status(200).json(subCategories);
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
});


router.route('/categories/:categoryId/subcategories/:subCategoryId')
    .put(verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
        const { categoryId, subCategoryId } = req.params;
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Subcategory name is required' });
            return;
        }

        try {
            const updatedSubCategory = await prisma.subCategory.update({
                where: { id: Number(subCategoryId) },
                data: { name, categoryId: Number(categoryId) },
            });
            res.status(200).json(updatedSubCategory);
        } catch (error) {
            console.error('Error updating subcategory:', error);
            res.status(500).json({ error: 'Failed to update subcategory' });
        }
    })

    .delete(verifyToken, isAdmin, async (req: Request, res: Response): Promise<void> => {
        const { subCategoryId } = req.params;

        try {
            await prisma.subCategory.delete({
                where: { id: Number(subCategoryId) },
            });
            res.status(200).json({ message: 'Subcategory deleted successfully' });
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            res.status(500).json({ error: 'Failed to delete subcategory' });
        }
    });


export default router;
