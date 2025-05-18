const axios = require('axios');
const BaseVendor = require('./base-vendor');

class EcomVendor extends BaseVendor {
  constructor(merchantId, accessKey) {
    super('http://staging.joinelixir.club/api/v1/marketplace');
    this.merchantId = merchantId;
    this.accessKey = accessKey;
    this.token = null;
  }

  // Authorize to get access token for other requests
  async authorize() {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/token`, {
        merchantId: this.merchantId,
        accessKey: this.accessKey,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
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
      const response = await axios.get(`${this.baseUrl}/serviceability`, {
        headers: { Authorization: `Bearer ${this.token}` },
        params: { city },
      });

      // Assuming API returns { serviceable: true/false }
      return response.data?.serviceable === true;
    } catch (err) {
      console.error('Serviceability check failed:', err.message);
      // Default to false if any error occurs
      return false;
    }
  }

  // Fetch products available from Ecom vendor
  async getProducts() {
    if (!this.token) await this.authorize();

    try {
      const response = await axios.get(`${this.baseUrl}/products`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      return response.data.products || [];
    } catch (err) {
      console.error('Ecom getProducts error:', err.message);
      throw new Error('Failed to get products from Ecom vendor');
    }
  }

  // Validate inventory for given product IDs
  async validateInventory(productIds) {
    if (!this.token) await this.authorize();

    try {
      const response = await axios.post(`${this.baseUrl}/inventory/validate`, {
        productIds,
      }, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      return response.data || {};
    } catch (err) {
      console.error('Ecom validateInventory error:', err.message);
      throw new Error('Inventory validation failed for Ecom vendor');
    }
  }

  // Place order with Ecom vendor
  async placeOrder({ city, items }) {
    if (!this.token) await this.authorize();

    try {
      const orderPayload = {
        city,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          externalOrderId: item.externalOrderId,
        })),
      };

      const response = await axios.post(`${this.baseUrl}/orders/place`, orderPayload, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (response.data.success) {
        return response.data.orderDetails;
      } else {
        throw new Error(response.data.message || 'Order placement failed');
      }
    } catch (err) {
      console.error('Ecom placeOrder error:', err.message);
      throw new Error('Failed to place order with Ecom vendor');
    }
  }
}

module.exports = EcomVendor;
