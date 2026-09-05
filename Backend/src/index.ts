import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/db.config.js';

dotenv.config();

const app = express();
const htppServer = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Configuración de WebSockets para la app
const io = new Server(htppServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Inicializar Base de Datos y Arrancar Servidor
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
    .then(() => {
        console.log('Base de datos inicializada correctamente');

        // Iniciar servidor HTTP / WebSocket solo si conecta la BD
        htppServer.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al inicializar la base de datos:', error);
    });