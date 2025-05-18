const EcomVendor = require('../services/ecom-vendor');
const VoucherVendor = require('../services/voucher-vendor');

function getVendor(vendorName) {
    if (vendorName === 'ecom') return new EcomVendor('Merchant Id', 'Access key');
    if (vendorName === 'voucher') return new VoucherVendor();
    throw new Error('Invalid vendor');
}

exports.getProducts = async (req, res) => {
    try {
        const vendor = getVendor(req.query.vendor);
        await vendor.authorize();
        const products = await vendor.getProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        const { city, items } = req.body;

        // Check if any ecom items exist and validate city for ecom vendor only
        const hasEcomItems = items.some(item => item.vendor === 'ecom');

        if (hasEcomItems) {
            const ecomVendor = getVendor('ecom');
            const isServiceable = await ecomVendor.isServiceable(city);
            if (!isServiceable) {
                return res.status(400).json({ error: 'City not serviceable for ecom vendor' });
            }
        }

        // Group items by vendor
        const groupedByVendor = items.reduce((acc, item) => {
            const { vendor } = item;
            if (!acc[vendor]) acc[vendor] = [];
            acc[vendor].push(item);
            return acc;
        }, {});

        const orderResults = {};

        // Place orders for each vendor separately
        for (const vendorName of Object.keys(groupedByVendor)) {
            const vendor = getVendor(vendorName);

            const orderData = {
                city,
                items: groupedByVendor[vendorName]
            };

            try {
                const result = await vendor.placeOrder(orderData);
                orderResults[vendorName] = { success: true, data: result };
            } catch (err) {
                orderResults[vendorName] = {
                    success: false,
                    error: err.message || 'Vendor order failed'
                };
            }
        }

        res.json({ orderResults });

    } catch (err) {
        console.error('Order API failed:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.validateInventory = async (req, res) => {
    try {
        const { vendor: vendorName, items } = req.body;

        if (!vendorName || !items) {
            return res.status(400).json({ error: 'vendor and items are required' });
        }

        const vendor = getVendor(vendorName);
        await vendor.authorize();
        const result = await vendor.validateInventory(items);
        res.json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
