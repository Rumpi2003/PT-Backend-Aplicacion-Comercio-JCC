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

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

routerApi(app);

// Configuración de WebSockets para la app
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Inicializar Base de Datos y Arrancar Servidor
AppDataSource.initialize()
    .then(() => {
        console.log('Base de datos inicializada correctamente');

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