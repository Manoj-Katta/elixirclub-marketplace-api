const axios = require('axios');
const dotenv = require('dotenv');
const { encryptPayload, decryptPayload } = require('../utils/encryption');
const BaseVendor = require('./base-vendor');
dotenv.config();

class VoucherVendor extends BaseVendor {
    constructor() {
        super(process.env.VOUCHER_BASEURL);
        this.username = process.env.VOUCHER_USERNAME;
        this.password = process.env.VOUCHER_PASSWORD;
    }

    // Authorize and get token for subsequent requests
    async authorize() {
        try {
            const response = await axios.get(`${this.baseUrl}/gettoken`, {
                headers: {
                    'Content-Type': 'application/json',
                    'username': this.username,
                    'password': this.password
                }
            });

            if (response.data.code === '0000' && response.data.status === 'success') {
                this.token = decryptPayload(response.data.data, false);
                // console.log(this.token);         
            } else {
                throw new Error('Failed to get token');
            }
        } catch (err) {
            console.error('Authorization failed', err.message);
            throw new Error('Voucher vendor authorization failed');
        }
    }

    // Fetch products, optionally filtered by brandProductCode
    async getProducts(BrandProductCode = null, OttRequired = 'N') {
        await this.authorize();
        
       const requestBody = BrandProductCode ? {
            BrandProductCode: BrandProductCode,
            OttRequired: OttRequired
        } : {};

        // console.log(requestBody);
        const payload = encryptPayload(requestBody);
        // console.log(payload);
        const response = await axios.post(`${this.baseUrl}/getbrands`,
             {payload} ,
            {
                headers: {
                    token: this.token,
                    'Content-Type': 'application/json',
                }
            }
        );

        const encryptedData = response.data?.data;
        const decrypted = decryptPayload(encryptedData);

        return Array.isArray(decrypted) ? decrypted : [decrypted];
    }

    // Place voucher order. city parameter included but no serviceability check here.
    async placeOrder({ city = '', items }) {
        await this.authorize();

        if (!items || items.length === 0) {
            throw new Error('No items provided for voucher placeOrder');
        }
        // Filter valid items with quantity > 0
        const validItems = items.filter(item => (item.quantity || item.Quantity) > 0);

        if (validItems.length === 0) {
            throw new Error('No valid items to place voucher order');
        }

        const allResults = [];

        // Process each valid item one by one
        for (const item of validItems) {
            const { BrandProductCode, Denomination, quantity, externalOrderId } = this.mapToVoucherRequest(item);

            const payloadData = {
                BrandProductCode,
                Denomination,
                Quantity: quantity,
                ExternalOrderId: externalOrderId
            };

            const payload = encryptPayload(payloadData);

            try {
                const response = await axios.post(`${this.baseUrl}/pullvoucher`, { payload }, {
                    headers: {
                        token: this.token,
                        'Content-Type': 'application/json'
                    }
                });

                const decrypted = decryptPayload(response.data?.data);

                if (decrypted.ErrorCode) {
                    throw new Error(`Voucher error: ${decrypted.ErrorMessage || 'Unknown error'}`);
                }

                allResults.push(decrypted);

            } catch (err) {
                console.error(`Voucher pull failed for item: ${item.sku}`, err.message);
                allResults.push({
                    error: true,
                    sku: item.sku,
                    message: err.message
                });
            }
        }

        return allResults;
    }

    // Validate inventory for given items
    async validateInventory(items) {
        await this.authorize();
        // console.log('Token:', this.token);
        const valid = [];
        const invalidProducts = [];

        for (const item of items) {
            const { BrandProductCode, Denomination } = item;

            const payload = encryptPayload({
                BrandProductCode,
                Denomination: Denomination,
            });

            const response = await axios.post(
                `${this.baseUrl}/getstock`,
                { payload },
                {
                    headers: { token: this.token, 'Content-Type': 'application/json' },
                }
            );
            // console.log('Raw api res: ', response.data);
            const decrypted = decryptPayload(response.data?.data);
            // console.log("Decrypted Response", decrypted);
            if (decrypted && decrypted.AvailableQuantity && parseInt(decrypted.AvailableQuantity) > 0) {
                valid.push({
                    BrandProductCode,
                    Denomination,
                    availableQuantity: parseInt(decrypted.AvailableQuantity),
                    brandName: decrypted.BrandName,
                });
            } else {
                invalidProducts.push({ BrandProductCode, Denomination });
            }
        }

        return { valid, invalidProducts };
    }

    // Maps generic item to voucher-specific request object
    mapToVoucherRequest(item) {
        return {
            BrandProductCode: item.BrandProductCode,
            Denomination: item.denomination || item.Denomination,
            quantity: item.quantity || item.Quantity,
            externalOrderId: item.ExternalOrderId || item.externalOrderId
        };
    }
}

module.exports = VoucherVendor;
