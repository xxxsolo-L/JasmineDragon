import express, { Application } from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client'
import dotenv from 'dotenv';
import userRoutes from './src/routes/everyRoutes';
import productsRouter from './src/routes/productsRouter'
import authRouter from './src/routes/authRouter'
import orderRouter from "./src/routes/orderRouter";
import categoryRouter from "./src/routes/categoryRouter";


dotenv.config();
const app: Application = express();
const prisma = new PrismaClient()
const port = process.env.PORT || 3000;

export {prisma, Prisma}; // prisma (my client)

app.use(cors());

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', productsRouter)
app.use('/api', authRouter)
app.use('/api', orderRouter)
app.use('/api', categoryRouter)

app.get('/', (req, res) => {
    res.send('Hello, TypeScript with PostgreSQL!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server is running on http://localhost:${port}`)
});




