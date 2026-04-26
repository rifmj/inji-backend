#!/bin/bash

# Quick curl test for checkout line update
# Replace the variables below with your actual values

SALEOR_URL="${SALEOR_BACKEND_URL:-https://your-saleor-backend-url.com/graphql/}"
SALEOR_TOKEN="${SALEOR_BACKEND_TOKEN:-your-token-here}"
CHECKOUT_TOKEN="${1:-aa608747-e15b-476b-96c3-07fb4dc7eb07}"

echo "Testing checkout line update..."
echo "URL: $SALEOR_URL"
echo "Checkout Token: $CHECKOUT_TOKEN"
echo ""

curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d "{
    \"operationName\": \"CheckoutLineUpdateInput\",
    \"variables\": {
      \"token\": \"$CHECKOUT_TOKEN\",
      \"lines\": [
        {
          \"quantity\": 1,
          \"variantId\": \"UHJvZHVjdFZhcmlhbnQ6MTg0NDE=\"
        }
      ]
    },
    \"query\": \"mutation CheckoutLineUpdateInput(\$token: UUID, \$lines: [CheckoutLineUpdateInput!]!) { checkoutLinesUpdate(token: \$token, lines: \$lines) { checkout { id lines { id variant { id product { id name } } quantity } totalPrice { gross { amount currency } } } errors { field message code } } }\"
  }" | python3 -m json.tool 2>/dev/null || cat





