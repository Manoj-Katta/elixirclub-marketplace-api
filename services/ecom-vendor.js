const axios = require('axios');
const dotenv = require('dotenv');
const BaseVendor = require('./base-vendor');
dotenv.config();

class EcomVendor extends BaseVendor {
  constructor(merchantId, accessKey) {
    super(process.env.ECOM_BASEURL);
    this.merchantId = merchantId;
    // process.env.ECOM_MERCHANT_ID;
    this.accessKey = accessKey;
    this.token = null;
  }

  // Authorize to get access token for other requests
  async authorize() {
    try {
      const response = await axios.get(`${this.baseUrl}/generate-jwt/${this.merchantId}`);

      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
      } else {
        throw new Error('Authorization failed: No token received');
      }
    } catch (err) {
      console.error('EcomVendor authorization error:', err.message);
      throw new Error('Ecom vendor authorization failed');
    }
  }

  // Check if a city is serviceable for delivery
  async isServiceable(city) {
    if (!this.token) await this.authorize();

    try {
      const response = await axios.get(`${this.baseUrl}/city-serviceable`, {
        headers: { 'X-Access-Key': this.accessKey },
        params: { city },
      });

      return response.data?.data?.serviceable === true;
    } catch (err) {
      console.error('Serviceability check failed:', err.message);
      return false;
    }
  }


  // Fetch products available from Ecom vendor
  async getProducts(query = "", filters = {}) {
    if (!this.token) await this.authorize();
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query,
          filters
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          }
        }
      );
      // console.log(response.data);

      return response.data || [];
    } catch (err) {
      if (err.response) {
        console.error('Ecom getProducts error:', err.message);
      }
      throw new Error('Failed to get products from Ecom vendor');
    }
  }


  // Validate inventory for given product IDs
  async validateInventory(items) {
    if (!this.token) await this.authorize();

    try {
      const response = await axios.post(
        `${this.baseUrl}/validate-inventory`,
        { items },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data?.data || {};
      const skus = data.skus || {};

      const availableSKUs = [];
      const invalidSKUs = [];

      for (const { sku, quantity: requestedQty } of items) {
        const info = skus[sku];

        if (info && info.quantity > 0) {
          const availableQty = Math.min(requestedQty, info.quantity);

          availableSKUs.push({
            sku,
            available_quantity: info.quantity,
            requested_quantity: requestedQty,
            offered_price: info.offered_price,
            total_price: info.offered_price * availableQty,
            discounted_price: info.discounted_price
          });
        } else {
          invalidSKUs.push({ sku, reason: info ? 'Out of stock' : 'Invalid SKU' });
        }
      }

      const totalAvailablePrice = availableSKUs.reduce(
        (sum, item) => sum + item.total_price,
        0
      );

      return {
        availableSKUs,
        invalidSKUs,
        totalAvailablePrice,
        payableAmount: data.payable_amount || 0,
        vasCharges: data.vas_charges || {},
        eta: data.eta || null,
      };
    } catch (err) {
      console.error('Ecom validateInventory error:', err.message);
      throw new Error('Inventory validation failed for Ecom vendor');
    }
  }



  // Place order with Ecom vendor
  async placeOrder({orderData}) {
    if (!this.token) await this.authorize();
    const orderId = orderData.orderId;
    const transactionId = orderData.transactionId;
    console.log(orderId + ', ' + transactionId );
    if (!orderId || !transactionId) {
      throw new Error('orderId and transactionId are required for Ecom placeOrder');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/confirm`,
        { transaction_id: transactionId },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );

      return response.data?.data || {};
    } catch (err) {
      if (err.response) {
        console.error('Ecom confirmOrder response error:', err.response.status, err.response.data);
      } else if (err.request) {
        console.error('Ecom confirmOrder no response error:', err.request);
      } else {
        console.error('Ecom confirmOrder setup error:', err.message);
      }
      throw new Error('Failed to confirm order with Ecom vendor');


    }
  }
}

module.exports = EcomVendor;
