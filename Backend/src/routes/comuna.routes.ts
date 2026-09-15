import { Router } from "express";
import { comunaController } from "../controllers/comuna.controller.js";

const router = Router();

router.get("/", comunaController.getAll);

export default router;