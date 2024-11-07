// uploadXlsxToDB.js
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';


const prisma = new PrismaClient();

interface ProductRow {
    Name?: string;
    Description?: string;
    Price?: number | string;
    Currency?: string;
    Images?: string;
    Stock?: number;
    CategoryId?: number;
    Subcategory?: number;
    Discount?: number;
    NameRO?: string;
    DescriptionRO?: string;
}

export async function uploadXlsxToDB(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).send('Файл не загружен.');
        }
        // Чтение загруженного .xlsx файла
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data: ProductRow[] = XLSX.utils.sheet_to_json(worksheet);

        // Обработка данных и пуш в БД
        for (const row of data) {
            await prisma.product.create({
                data: {
                    name: row.Name || "No name",
                    description: row.Description || "No description",
                    price: row.Price?.toString() || "0",
                    currency: row.Currency || "MDL",
                    imageUrl: row.Images ? row.Images.split(',').map(img => img.trim()) : [],
                    stock: row.Stock || 0,
                    categoryId: row.CategoryId || 1,
                    subCategoryId: row.Subcategory || null,
                    discount: row.Discount || 0.0,
                    nameRo: row.NameRO || null,
                    descriptionRo: row.DescriptionRO || null,
                },
            });
        }
        console.log('Данные успешно загружены в базу данных.');
    } catch (error) {
        console.error('Ошибка при обработке файла:', error);
        throw new Error('Ошибка при загрузке данных в базу данных');
    } finally {
        await prisma.$disconnect();
    }
}
