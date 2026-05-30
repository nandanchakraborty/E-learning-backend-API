const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');
const { logger, morganLogger } = require('./utils/logger');
const userHandler = require('../src/handler/userHandler');
const instructorHandler = require('../src/handler/instructorHandler');
const studentHandler = require('../src/handler/studentHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganLogger);
app.use('/user',userHandler);
app.use('/ins',instructorHandler);
app.use('/student',studentHandler)


// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Route
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: 2024-05-25T10:30:00Z
 */
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (add your routes here)
// app.use('/api/users', userRoutes);
// app.use('/api/courses', courseRoutes);
// etc.

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    statusCode: 404,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
  });
});

module.exports = app;
