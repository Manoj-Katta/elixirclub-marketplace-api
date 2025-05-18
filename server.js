const express = require('express');
const marketplaceRoutes = require('./routes/marketplace-routes');
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use('/api/v1/marketplace', marketplaceRoutes);

app.listen(PORT, () => {
    console.log(`Server connected on PORT: ${PORT}`);
})

