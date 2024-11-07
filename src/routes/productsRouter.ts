import {Router, Request, Response} from 'express';
import {prisma, Prisma} from "../../server";
// import { parseExcelAndPushToDB } from '../utils/excelParser';
import { uploadXlsxToDB } from '../utils/uploadXlsxToDb';
import multer from "multer";
import isAdmin from "../middleware/isAdmin";
import {verifyToken} from "../middleware/auth";

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Папка для временного хранения загруженных файлов


router.route('/products')
    .get(async (req: Request, res: Response) => {
    const products = await prisma.product.findMany();
    console.log(products)
    res.status(200).json(products);
})
    .post(async (req: Request, res: Response) => {
        const {
            name = "No name",
            description = "No description",
            price = "0",
            currency = "MDL",
            imageUrl = [],
            stock = 0,
            categoryId = 1,
            discount = 0.0,
            subCategoryId = null,
            nameRo = null,
            descriptionRo = null
        } = req.body;
    try {
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price,
                currency,
                imageUrl: typeof imageUrl === "string"
                    ? imageUrl.split(',').map((img: string) => img.trim())
                    : imageUrl,   // Если массив, оставляем как есть
                stock,
                categoryId,
                createdAt: new Date(),
                updatedAt: new Date(),
                discount,
                subCategoryId,
                nameRo,
                descriptionRo,
            }
        })
        res.status(201).json(newProduct);
    } catch(error){
        console.error(error);
        res.status(500).json({ error: "An error occurred while creating the product." });
    }
}) // good

router.route('/products/:id')
    .get(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            // Ищем продукт по ID, преобразуем id в число, так как id имеет тип Int
            const product = await prisma.product.findUnique({
                where: {
                    id: parseInt(id, 10),
                },
                include: {
                    Category: true,
                    SubCategory: true,
                    Review: true,
                },
            });

            if (!product) {
                // Если продукт не найден, отправляем 404
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            // Отправляем найденный продукт
            res.status(200).json(product);
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    })
    .put(verifyToken, isAdmin, async (req:Request, res:Response): Promise<void> => {
        const { id } = req.params;
        const productId = parseInt(id, 10);

        if (isNaN(productId)) {
            res.status(400).json({ error: 'Invalid product ID' });
            return;
        }

        // Создаем объект `data` и добавляем только определенные свойства
        const data: Partial<Prisma.ProductUncheckedUpdateInput> = { ...req.body };

        try {
            const updatedProduct = await prisma.product.update({
                where: { id: productId },
                data,
            });

            res.status(200).json(updatedProduct);
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    })
    .delete(verifyToken, isAdmin, async (req:Request, res:Response): Promise<void> => {
        const { id } = req.params;
        const productId = parseInt(id, 10);

        // Проверка корректности ID
        if (isNaN(productId)) {
            res.status(400).json({ error: 'Invalid product ID' });
            return;
        }

        try {
            // Удаляем продукт по ID
            const deletedProduct = await prisma.product.delete({
                where: { id: productId },
            });

            // Возвращаем успешный ответ с информацией об удалённом продукте
            res.status(200).json({ message: 'Product deleted successfully', deletedProduct });
        } catch (error) {
            console.error("Error deleting product:", error);
            // Приведение `error` к `Prisma.PrismaClientKnownRequestError` для проверки кода ошибки
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    res.status(404).json({ error: 'Product not found' });
                } else {
                    res.status(500).json({ error: 'Failed to delete product' });
                }
            } else {
                res.status(500).json({ error: 'An unexpected error occurred' });
            }
        }
    })

// router.post('/import', async (req, res) => {  // маршрут на парсинг
//     try {
//         await parseExcelAndPushToDB();
//         res.status(200).send('Данные успешно загружены в базу данных');
//     } catch (error) {
//         res.status(500).send('Ошибка при загрузке данных');
//     }
// }); // old, need del

router.post('/upload', verifyToken, isAdmin, upload.single('xlsxFile'), async (req, res) => {
    try {
        await uploadXlsxToDB(req, res);
        res.send('Данные успешно загружены в базу данных.');
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
}) // last good

export default router;

