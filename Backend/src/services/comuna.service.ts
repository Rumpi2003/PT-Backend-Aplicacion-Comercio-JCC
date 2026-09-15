import { AppDataSource } from "../config/db.config.js";
import { Comuna } from "../entities/comuna.entity.js";

export const comunaService = {
    getAll: async () => {
        return await AppDataSource.getRepository(Comuna).find();
    }
}