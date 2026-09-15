import { AppDataSource } from "../config/db.config.js";
import { Comuna } from "../entities/comuna.entity.js";

const comunas = [
    // Provincia de Concepción
    { nombre_comuna: "Chiguayante", region: "Biobío" },
    { nombre_comuna: "Concepción", region: "Biobío" },
    { nombre_comuna: "Coronel", region: "Biobío" },
    { nombre_comuna: "Florida", region: "Biobío" },
    { nombre_comuna: "Hualpén", region: "Biobío" },
    { nombre_comuna: "Hualqui", region: "Biobío" },
    { nombre_comuna: "Lota", region: "Biobío" },
    { nombre_comuna: "Penco", region: "Biobío" },
    { nombre_comuna: "San Pedro de la Paz", region: "Biobío" },
    { nombre_comuna: "Santa Juana", region: "Biobío" },
    { nombre_comuna: "Talcahuano", region: "Biobío" },
    { nombre_comuna: "Tomé", region: "Biobío" },
    // Provincia de Biobío
    { nombre_comuna: "Alto Biobío", region: "Biobío" },
    { nombre_comuna: "Antuco", region: "Biobío" },
    { nombre_comuna: "Cabrero", region: "Biobío" },
    { nombre_comuna: "Laja", region: "Biobío" },
    { nombre_comuna: "Los Ángeles", region: "Biobío" },
    { nombre_comuna: "Mulchén", region: "Biobío" },
    { nombre_comuna: "Nacimiento", region: "Biobío" },
    { nombre_comuna: "Negrete", region: "Biobío" },
    { nombre_comuna: "Quilaco", region: "Biobío" },
    { nombre_comuna: "Quilleco", region: "Biobío" },
    { nombre_comuna: "San Rosendo", region: "Biobío" },
    { nombre_comuna: "Santa Bárbara", region: "Biobío" },
    { nombre_comuna: "Tucapel", region: "Biobío" },
    { nombre_comuna: "Yumbel", region: "Biobío" },
    // Provincia de Arauco
    { nombre_comuna: "Arauco", region: "Biobío" },
    { nombre_comuna: "Cañete", region: "Biobío" },
    { nombre_comuna: "Contulmo", region: "Biobío" },
    { nombre_comuna: "Curanilahue", region: "Biobío" },
    { nombre_comuna: "Lebu", region: "Biobío" },
    { nombre_comuna: "Los Álamos", region: "Biobío" },
    { nombre_comuna: "Tirúa", region: "Biobío" }
]

export async function seedComunas() {
    const comunaRepository = AppDataSource.getRepository(Comuna);
    for (const comuna of comunas) {
        const existingComuna = await comunaRepository.findOneBy({ nombre_comuna: comuna.nombre_comuna });
        if (!existingComuna) {
            const newComuna = comunaRepository.create(comuna);
            await comunaRepository.save(newComuna);
            console.log(`Comuna ${comuna.nombre_comuna} creada.`);
        }
    }
}