import { type Express, type Request, type Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import packageJson from '../../package.json' with { type: 'json' };

const { version } = packageJson;

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.1.1",
        info: {
            title: "Documentación API Comercio JCC",
            version: version
        },
        components: {
            securitySchemas: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app: Express, port: number){
    // Página Swagger con la documentación de la API
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Documentación formato JSON
    app.get('/docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`Documentación Swagger disponible en http://localhost:${port}/docs`);
    console.log(`Documentación Swagger en formato JSON disponible en http://localhost:${port}/docs.json`);
}

export default swaggerDocs;