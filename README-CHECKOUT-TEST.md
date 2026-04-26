# Testing Saleor Checkout Line Update

## Problem
The `checkoutLinesUpdate` mutation returns `checkout: null`, indicating the checkout update failed.

## Solution
Use the provided scripts to test the checkout update with the Saleor backend token.

## Quick Test (Simple Script)

```bash
# Set environment variables
export SALEOR_BACKEND_URL="https://your-saleor-backend-url.com/graphql/"
export SALEOR_BACKEND_TOKEN="your-saleor-backend-token"

# Run the test
./test-checkout-simple.sh [CHECKOUT_TOKEN]
```

## Full Test (Detailed Script)

```bash
# Set environment variables
export SALEOR_BACKEND_URL="https://your-saleor-backend-url.com/graphql/"
export SALEOR_BACKEND_TOKEN="your-saleor-backend-token"

# Run the full test
./test-checkout.sh [SALEOR_BACKEND_URL] [SALEOR_BACKEND_TOKEN] [CHECKOUT_TOKEN]
```

## Manual curl Command

```bash
curl -X POST "https://your-saleor-backend-url.com/graphql/" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT your-saleor-backend-token" \
  -d '{
    "operationName": "CheckoutLineUpdateInput",
    "variables": {
      "token": "aa608747-e15b-476b-96c3-07fb4dc7eb07",
      "lines": [
        {
          "quantity": 1,
          "variantId": "UHJvZHVjdFZhcmlhbnQ6MTg0NDE="
        }
      ]
    },
    "query": "mutation CheckoutLineUpdateInput($token: UUID, $lines: [CheckoutLineUpdateInput!]!) { checkoutLinesUpdate(token: $token, lines: $lines) { checkout { id lines { id variant { id product { id name } } quantity } totalPrice { gross { amount currency } } } errors { field message code } } }"
  }'
```

## Common Issues

1. **Checkout returns null**: 
   - Check if the checkout token is valid
   - Verify the checkout hasn't expired
   - Check if the variant ID exists and is available

2. **Authorization errors**:
   - Verify `SALEOR_BACKEND_TOKEN` is correct
   - Check token permissions (should have checkout management permissions)

3. **Variant not found**:
   - Verify the variant ID `UHJvZHVjdFZhcmlhbnQ6MTg0NDE=` exists
   - Check if the variant is available for purchase

## Getting Environment Variables

The tokens are stored in environment variables. To get them:

1. Check `.env` file in the backend directory
2. Check your deployment environment variables
3. Look for `SALEOR_BACKEND_URL` and `SALEOR_BACKEND_TOKEN`

## Expected Response

A successful response should look like:

```json
{
  "data": {
    "checkoutLinesUpdate": {
      "checkout": {
        "id": "...",
        "lines": [...],
        "totalPrice": {...}
      },
      "errors": []
    }
  }
}
```

If `checkout` is `null`, check the `errors` array for details.





