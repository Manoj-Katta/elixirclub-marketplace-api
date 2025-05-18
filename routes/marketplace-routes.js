const express = require('express');
const {getProducts, placeOrder, validateInventory} = require('../controllers/marketplace-controller');

const router = express.Router();

router.get('/products', getProducts);
router.post('/validate-inventory', validateInventory);
router.post('/order', placeOrder);

module.exports = router;