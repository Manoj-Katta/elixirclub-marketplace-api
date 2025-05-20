# Marketplace Order API
This project implements a simple marketplace API integrating multiple vendors (ecom, voucher) with modular design and clear separation of concerns.
## Folder Structure

- controllers/ - API route handlers (request/response logic)
- services/ - Vendor-specific logic and business rules
- utils/ - Utility/helper functions
- routes/ - API route definitions
- server.js - Entry point

## How to Run

1. Clone repo and install dependencies:
```
git clone https://github.com/Manoj-Katta/elixirclub-marketplace-api.git

cd elixirclub-marketplace-backend

npm install
```
2. Setup environment variables:
- Create `.env` file with required keys (e.g., VOUCHER_USERNAME, VOUCHER_PASSWORD)
```
ECOM_MERCHANT_ID=your_merchant_id
ECOM_ACCESS_KEY=your_access_key
PORT=3000
VOUCHER_BASEURL=voucher_baseurl
ECOM_BASEURL=ecom_baseurl
ECOM_MERCHANT_ID=your_merchant_id
ECOM_ACCESS_KEY=your_access_key
```

3. Start server:
```
npm start
```

4. The API will be available at:
```
http://localhost:3000/api/v1/marketplace/
```

## Sample Requests

### Get All Products

#### Voucher Vendor:
Request:

GET `/api/v1/marketplace/products?vendor=voucher`

Body:
```json
{
    "BrandProductCode": {},
    "OttRequired": "N"
}
```

Response:
```json
[
    {
        "BrandProductCode": "Bata4xfRrUnT46Uv4iol",
        "BrandName": "Bata",
        "Brandtype": "VOUCHER",
        "RedemptionType": "2",
        "OnlineRedemptionUrl": "https://www.bata.in/",
        "BrandImage": "https://cdn.gyftr.com/comm_engine/stag/images/brands/1593693691875_u3qtc3vzkc4s2qqr.png",
        "denominationList": "100,500",
        "stockAvailable": "true",
        "Category": "BATA-API,Footwear",
        "Descriptions": "Affordable footwear.",
        "tnc": "Bata T&C apply.",
        "importantInstruction": "Use within validity.",
        "redeemSteps": "{\"1\":{\"text\":\"Locate outlet\"},\"2\":{\"text\":\"Select product\"},\"3\":{\"text\":\"Share voucher\"}}"
    },
    {
        "BrandProductCode": "BenettonRwJ6cqVWqPPML1BH",
        "BrandName": "Benetton",
        "Brandtype": "VOUCHER",
        "RedemptionType": "3",
        "OnlineRedemptionUrl": "https://benetton.example.com/",
        "BrandImage": "https://via.placeholder.com/100?text=Benetton",
        "denominationList": "500,1000,5000",
        "stockAvailable": "true",
        "Category": "Fashion,Apparel",
        "Descriptions": "Colorful apparel.",
        "tnc": "Benetton T&C apply.",
        "importantInstruction": "Valid online and offline.",
        "redeemSteps": "{\"1\":{\"text\":\"Visit store/website\"},\"2\":{\"text\":\"Add to cart\"},\"3\":{\"text\":\"Apply voucher\"}}"
    }
]
```

#### Ecom Vendor:

Request:

GET `/api/v1/marketplace/products?vendor=ecom`

Body:
```json
{
    "query": "telma",
    "filters": {
        "rx_required": true,
        "type": "drug"
    }
}

```

Response:
```json
[
    {
        "BrandProductCode": "Bata4xfRrUnT46Uv4iol",
        "BrandName": "Bata",
        "Brandtype": "VOUCHER",
        "RedemptionType": "2",
        "OnlineRedemptionUrl": "https://www.bata.in/",
        "BrandImage": "https://cdn.gyftr.com/comm_engine/stag/images/brands/1593693691875_u3qtc3vzkc4s2qqr.png",
        "denominationList": "100,500",
        "stockAvailable": "true",
        "Category": "BATA-API,Footwear",
        "Descriptions": "Affordable footwear.",
        "tnc": "Bata T&C apply.",
        "importantInstruction": "Use within validity.",
        "redeemSteps": "{\"1\":{\"text\":\"Locate outlet\"},\"2\":{\"text\":\"Select product\"},\"3\":{\"text\":\"Share voucher\"}}"
    },
    {
        "BrandProductCode": "BenettonRwJ6cqVWqPPML1BH",
        "BrandName": "Benetton",
        "Brandtype": "VOUCHER",
        "RedemptionType": "3",
        "OnlineRedemptionUrl": "https://benetton.example.com/",
        "BrandImage": "https://via.placeholder.com/100?text=Benetton",
        "denominationList": "500,1000,5000",
        "stockAvailable": "true",
        "Category": "Fashion,Apparel",
        "Descriptions": "Colorful apparel.",
        "tnc": "Benetton T&C apply.",
        "importantInstruction": "Valid online and offline.",
        "redeemSteps": "{\"1\":{\"text\":\"Visit store/website\"},\"2\":{\"text\":\"Add to cart\"},\"3\":{\"text\":\"Apply voucher\"}}"
    }
]
```
### Validate Inventory
#### Voucher vendor:
Request:

POST `/api/v1/marketplace/validate-inventory`

Body:

```json
{
  "vendor": "voucher",
  "items": [
    { "BrandProductCode": "BenettonRwJ6cqVWqPPML1BH", "Denomination": "1000" }
  ]
}
```
Response:
```json
{
    "valid": [
        {
            "BrandProductCode": "BenettonRwJ6cqVWqPPML1BH",
            "Denomination": "1000",
            "availableQuantity": 50,
            "brandName": "Benetton"
        }
    ],
    "invalidProducts": []
}
```
#### Ecom Vendor:
Request:

POST `/api/v1/marketplace/validate-inventory`

Body:
```json
{
  "vendor": "ecom",
   "items": [
        {
            "sku": "340679",
            "quantity": 0
        }
    ]
}
```

Response:
```json
{
    "availableSKUs": [],
    "invalidSKUs": [
        {
            "sku": "340679",
            "reason": "Invalid SKU"
        }
    ],
    "totalAvailablePrice": 0,
    "payableAmount": 0,
    "vasCharges": {},
    "eta": null
}
```


### Place Order

POST `/api/v1/marketplace/order`

Body:

```json
{
  "city": "New Delhi",
  "orderId": "order_12345",
  "transactionId": "txn_abcde",
  "items": [
    {
      "vendor": "ecom",
      "productId": "prod_001",
      "quantity": 2
    },
    {
      "vendor": "voucher",
      "BrandProductCode": "BenettonRwJ6cqVWqPPML1BH",
      "Denomination": "5000",
      "Quantity": 2,
      "ExternalOrderId": "teststaging-05"
    }
  ]
}

```
Response:

```json
{
    "orderResults": {
        "ecom": {
            "success": true,
            "data": {
                "order_id": "order_12345",
                "message": "Order confirmation processed (mock). Waiting for payment verification.",
                "status": "CONFIRMED"
            }
        },
        "voucher": {
            "success": true,
            "data": [
                {
                    "ErrorCode": "",
                    "ErrorMessage": "",
                    "ExternalOrderIdOut": "teststaging-05",
                    "BrandProductCode": "BenettonRwJ6cqVWqPPML1BH",
                    "Message": "Process successfully completed",
                    "PullVouchers": [
                        {
                            "ProductGuid": "c245f82d-fe09-4ae1-bdab-95e1e29a1628",
                            "ProductName": "Benetton",
                            "VoucherName": "Benetton INR 5000",
                            "Vouchers": [
                                {
                                    "EndDate": "31 Dec 2024",
                                    "Value": "5000.00",
                                    "VoucherGCcode": "GCCODE_1747761470976_0",
                                    "VoucherGuid": "bd47966d-87f3-4e24-99ca-1ff3d4d6da7e",
                                    "VoucherNo": "BV_1747761470976_0",
                                    "Voucherpin": "5174"
                                },
                                {
                                    "EndDate": "31 Dec 2024",
                                    "Value": "5000.00",
                                    "VoucherGCcode": "GCCODE_1747761470976_1",
                                    "VoucherGuid": "e6ceaff6-6c7c-41eb-be29-4332f0dbf7b8",
                                    "VoucherNo": "BV_1747761470976_1",
                                    "Voucherpin": "8264"
                                }
                            ]
                        }
                    ],
                    "ResultType": "SUCCESS"
                }
            ]
        }
    }
}
```



### 📘 API Documentation

This project uses Swagger UI for interactive API docs.

To view the documentation:

- Start the server: `npm start` (or your run command)
- Open in browser: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

API Spec is defined in [`docs/swagger.yaml`](./docs/swagger.yaml).



