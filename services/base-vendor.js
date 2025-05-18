class BaseVendor {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async authorize() {
    throw new Error("authorize() not implemented");
  }

  async getProducts() {
    throw new Error("getProducts() not implemented");
  }

  async validateInventory(productIds) {
    throw new Error("validateInventory() not implemented");
  }

  async placeOrder(orderData) {
    throw new Error("placeOrder() not implemented");
  }
}

module.exports = BaseVendor;
