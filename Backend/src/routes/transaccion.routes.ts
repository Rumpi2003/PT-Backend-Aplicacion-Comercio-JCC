import { Router } from 'express';
import { transaccionController } from '../controllers/transaccion.controller.js';
import { mensajeController } from '../controllers/mensaje.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, transaccionController.listarTransacciones);
router.get('/contraparte/:idUsuario/inventario', authMiddleware, transaccionController.obtenerInventarioContraparte);
router.get('/contraparte/:idUsuario/mi-inventario', authMiddleware, transaccionController.obtenerMiInventario);
router.get('/:idTransaccion', authMiddleware, transaccionController.obtenerTransaccion);
router.get('/:idTransaccion/mensajes', authMiddleware, mensajeController.listarMensajes);
router.patch('/:idTransaccion/mensajes/leidos', authMiddleware, mensajeController.marcarLeidos);
router.post('/', authMiddleware, transaccionController.crearTransaccion);
router.patch('/:idTransaccion/cancelar', authMiddleware, transaccionController.cancelarTransaccion);
router.put('/:idTransaccion/contraoferta', authMiddleware, transaccionController.contraofertar);
router.patch('/:idTransaccion/aceptar', authMiddleware, transaccionController.aceptarTransaccion);
router.patch('/:idTransaccion/rechazar', authMiddleware, transaccionController.rechazarTransaccion);
router.patch('/:idTransaccion/completar', authMiddleware, transaccionController.completarTransaccion);
router.delete('/:idTransaccion/completar', authMiddleware, transaccionController.retirarConfirmacion);

export default router;
