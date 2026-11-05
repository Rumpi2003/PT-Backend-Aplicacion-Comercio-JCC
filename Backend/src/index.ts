import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/db.config.js';
import routerApi from './routes/index.routes.js';
import swaggerDocs from './utils/swagger.js';
import { seedComunas } from './seeds/comuna.seed.js';
import { seedFranquicias } from './seeds/franquicia.seed.js';
import { iniciarExpiracionTransacciones } from './services/transaccion.service.js';
import { initSockets } from './sockets/index.js';
import { notificacionService } from './services/notificacion.service.js';
import type { ChatServer } from './sockets/chat.types.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

routerApi(app);

// WebSockets para el chat. El cliente es una app nativa (sin CORS); el acceso lo controla el JWT del handshake
const io: ChatServer = new Server(httpServer, {
    maxHttpBufferSize: 16 * 1024
});
initSockets(io);

// Inicializar Base de Datos y Arrancar Servidor
AppDataSource.initialize()
    .then(async () => {
        console.log('Base de datos inicializada correctamente');

        // Sembrar comunas
        await seedComunas();
        
        // Sembrar franquicias (Api externa)
        try {
            await seedFranquicias();
        } catch (error) {
            console.error('No se pudieron sembrar las franquicias, el servidor continuará:', error);
        }

        // Cancelar periódicamente las transacciones vencidas
        iniciarExpiracionTransacciones();

        // Notificaciones push (se desactivan si no hay credenciales de Firebase)
        notificacionService.iniciar();

        // Iniciar servidor HTTP / WebSocket solo si conecta la BD
        httpServer.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

        // Configurar documentación Swagger
        swaggerDocs(app, Number(PORT));
    })
    .catch((error) => {
        console.error('Error al inicializar la base de datos:', error);
    });