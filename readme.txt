npm init -y
npm install express sequelize pg pg-hstore jsonwebtoken bcryptjs
npm install typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs --save-dev
npx tsc --init

npm install prisma @prisma/client
npx prisma init

npm install cors
npm install @types/cors --save-dev

npm install xlsx


// создать категории, а потом продукт //\\!!!!!!!!!

// парсер excel file xlxs //\\!!!!!!!!!

// + в бд (и парсер соответсвенно) title Чай на румынском

// добавить колонку с валютой, сделать imageUrl: string[], parser //\\!!!!!!!!!!!

// сделать архаичный xlsx файл для парса в БД новых данных(прописать 0-вые и не 0-вые поля) !\\ проверить images

// регистрация, jwt (посмотреть форму заказа) [authRouter GGGGGOOO]