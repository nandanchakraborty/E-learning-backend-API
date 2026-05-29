require('dotenv').config();
const app = require('./src/app');
const { logger } = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.consoleOnly(` E-Learning API Server running on http://localhost:${PORT}`);
  logger.consoleOnly(` Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
           