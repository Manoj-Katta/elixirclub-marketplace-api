class MockEcomVendor {
    constructor() {
        this.token = 'mock-token';
    }

    async authorize() {
        // Simulate authorization success
        this.token = 'mock-token';
    }

    async isServiceable(city) {
        // Mock: all cities are serviceable
        return true;
    }

    async getProducts() {
        // Return some mock products
        return [
            { productId: 'mockProd1', name: 'Mock Product 1', quantityAvailable: 10 },
            { productId: 'mockProd2', name: 'Mock Product 2', quantityAvailable: 5 },
        ];
    }

    async validateInventory(items) {
        const result = {};
        for (const item of items) {
            result[item.productId] = { available: true, quantity: 10 };
        }
        return result;
    }


    async placeOrder({ city, items }) {
        // Simulate a successful order placement
        return {
            orderId: 'mockOrder123',
            city,
            items,
            status: 'success',
            message: 'Mock order placed successfully',
        };
    }
}

module.exports = MockEcomVendor;
