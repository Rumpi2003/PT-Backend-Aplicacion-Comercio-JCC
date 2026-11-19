import { Router } from "express";
import { comunaController } from "../controllers/comuna.controller.js";

const router = Router();

/**
 * @openapi
 * /comunas:
 *   get:
 *     summary: Listar las comunas disponibles
 *     tags:
 *       - Comunas
 *     security: []
 *     responses:
 *       200:
 *         description: Listado de comunas obtenido con éxito
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", comunaController.getAll);

export default router;