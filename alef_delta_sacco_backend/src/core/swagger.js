import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const yamlPath = path.join(__dirname, '../../openapi.yaml');

// Load YAML file using yamljs (works with file paths)
const swaggerDocument = YAML.load(yamlPath);

// Update server URL based on environment
if (process.env.API_BASE_URL) {
  swaggerDocument.servers = [{ url: process.env.API_BASE_URL }];
} else if (config.env === 'development') {
  swaggerDocument.servers = [
    { url: `http://localhost:${config.port}/api`, description: 'Development server' }
  ];
}

export function setupSwagger(app) {
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ALEF-DELTA SACCO API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));

  // JSON endpoint for the spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // YAML endpoint for the spec (serve original file)
  app.get('/api-docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    const yamlContent = readFileSync(yamlPath, 'utf8');
    res.send(yamlContent);
  });
}

export default swaggerDocument;

