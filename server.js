const express = require('express');
const marketplaceRoutes = require('./routes/marketplace-routes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const PORT = process.env.PORT || 3000;
const app = express();
const swaggerDocument = YAML.load('./swagger.yaml');

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/marketplace', marketplaceRoutes);

app.listen(PORT, () => {
    console.log(`Server connected on PORT: ${PORT}`);
})

