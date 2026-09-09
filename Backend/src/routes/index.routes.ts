import { Router, type Application } from 'express';
import authRoutes from './auth.routes.js'

export default function routerApi(app: Application) {
    const router = Router();
    app.use('/api', router);

    router.use('/auth', authRoutes);
}