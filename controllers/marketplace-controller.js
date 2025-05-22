const EcomVendor = require('../services/ecom-vendor');
const VoucherVendor = require('../services/voucher-vendor');
const dotenv = require('dotenv');
dotenv.config();

function getVendor(vendorName) {
  if (vendorName === 'ecom') {
    const merchantId = process.env.ECOM_MERCHANT_ID;
    const accessKey = process.env.ECOM_ACCESS_KEY;
    return new EcomVendor(merchantId, accessKey);
  }
  if (vendorName === 'voucher') return new VoucherVendor();
  throw new Error('Invalid vendor');
}

exports.getProducts = async (req, res) => {
  try {
    const vendorName = req.query.vendor;
    if (!vendorName) {
      return res.status(400).json({ error: 'Vendor is required' });
    }

    const vendor = getVendor(vendorName);
    await vendor.authorize();

    let query = "";
    let filters = {};
    let BrandProductCode = "";
    let OttRequired = "";

    BrandProductCode = req.body.BrandProductCode || req.body.brandProductCode;
    OttRequired = req.body.OttRequired || req.body.ottRequired;

    query = req.body.query || "";
    filters = req.body.filters || {};

    if (BrandProductCode) {
      const products = await vendor.getProducts(BrandProductCode, OttRequired);
      res.json(products);
    }
    else {
      const products = await vendor.getProducts(query, filters);
      res.json(products);
    }
  } catch (err) {
    console.error("getProducts error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { city = '', items = [], orderId, transactionId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided in the order' });
    }

    // Validate ecom vendor serviceability if there are any ecom items
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
      if (!vendor) return acc; // Skip items with no vendor
      if (!acc[vendor]) acc[vendor] = [];
      acc[vendor].push(item);
      return acc;
    }, {});

    const orderResults = {};

    // Process each vendor separately
    for (const vendorName of Object.keys(groupedByVendor)) {
      const vendor = getVendor(vendorName);

      let orderData;

      if (vendorName === 'ecom') {
        // For ecom vendor, require orderId and transactionId in request body
        if (!orderId || !transactionId) {
          orderResults[vendorName] = {
            success: false,
            error: 'Missing orderId or transactionId for ecom order'
          };
          continue;
        }
        orderData = { orderId, transactionId };

      } else if (vendorName === 'voucher') {
        // For voucher vendor, send city and items formatted as expected

        const formattedItems = groupedByVendor[vendorName].map(item => ({
          BrandProductCode: item.BrandProductCode || item.brandProductCode,
          Denomination: item.Denomination || item.denomination,
          Quantity: item.Quantity || item.quantity || 1,
          ExternalOrderId: item.ExternalOrderId || item.externalOrderId || ''
        }));

        if (formattedItems.length === 0) {
          orderResults[vendorName] = {
            success: false,
            error: 'No valid items to place voucher order'
          };
          continue;
        }

        orderData = {
          city,
          items: formattedItems
        };

      } else {
        // Default: pass city and items for other vendors
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

    return res.json({ orderResults });

  } catch (err) {
    console.error('Order API failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
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
