const EcomVendor = require('../services/ecom-vendor');
const VoucherVendor = require('../services/voucher-vendor');
const MockEcomVendor = require('../services/mock-ecom-vendor');
const dotenv = require('dotenv');
dotenv.config();

function getVendor(vendorName) {
    if (vendorName === 'ecom') {
        const merchantId = process.env.ECOM_MERCHANT_ID;
        const accessKey = process.env.ECOM_ACCESS_KEY;
       //console.log(merchantId);
        // if (merchantId && !accessKey) {
        return new EcomVendor(merchantId, accessKey);
        // }
        // } else {
        //     console.warn('Ecom credentials missing - using MockEcomVendor');
        //     return new MockEcomVendor();
        // }
    }
    if (vendorName === 'voucher') return new VoucherVendor();
    throw new Error('Invalid vendor');
}

exports.getProducts = async (req, res) => {
  try {
    const vendorName = req.query.vendor;
    const query = req.query.query || "";
    let filters = {};

    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters);
      } catch {
        return res.status(400).json({ error: 'Invalid filters JSON' });
      }
    }

    const vendor = getVendor(vendorName);
    await vendor.authorize();

    const products = await vendor.getProducts(query, filters);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.placeOrder = async (req, res) => {
  try {
    const { city, items, orderId, transactionId } = req.body;

    // Validate inputs for ecom vendor serviceability
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

    // Call placeOrder for each vendor with proper params
    for (const vendorName of Object.keys(groupedByVendor)) {
      const vendor = getVendor(vendorName);

      // Prepare vendor-specific orderData
      let orderData;

      if (vendorName === 'ecom') {
        // For ecom, we expect orderId and transactionId from the request body
        if (!orderId || !transactionId) {
          orderResults[vendorName] = {
            success: false,
            error: 'Missing orderId or transactionId for ecom order'
          };
          continue;
        }
        orderData = { orderId, transactionId };

      } else if (vendorName === 'voucher') {
        orderData = {
          city,
          items: groupedByVendor[vendorName]
        };
      } else {
        // Default fallback for other vendors, just pass items and city
        orderData = {
          city,
          items: groupedByVendor[vendorName]
        };
      }

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
