import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

    router.route('/users')
        .get((req: Request, res: Response) => {
            res.send('GET all users');
        })
        .post((req: Request, res: Response) => {
            res.send('POST new user');
        })
        .put((req: Request, res: Response) => {
            res.send('PUT update user');
        })
        .delete((req: Request, res: Response) => {
            res.send('DELETE user');
        });

export default router;