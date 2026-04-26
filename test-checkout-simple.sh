#!/bin/bash

# Simple curl command to test checkout line update
# Replace SALEOR_BACKEND_URL and SALEOR_BACKEND_TOKEN with your actual values
# Usage: SALEOR_BACKEND_URL="..." SALEOR_BACKEND_TOKEN="..." ./test-checkout-simple.sh

SALEOR_URL="${SALEOR_BACKEND_URL}"
SALEOR_TOKEN="${SALEOR_BACKEND_TOKEN}"
CHECKOUT_TOKEN="${1:-aa608747-e15b-476b-96c3-07fb4dc7eb07}"

if [ -z "$SALEOR_URL" ] || [ -z "$SALEOR_TOKEN" ]; then
  echo "Error: SALEOR_BACKEND_URL and SALEOR_BACKEND_TOKEN must be set"
  echo "Usage: SALEOR_BACKEND_URL='...' SALEOR_BACKEND_TOKEN='...' ./test-checkout-simple.sh [CHECKOUT_TOKEN]"
  exit 1
fi

echo "Testing CheckoutLineUpdate mutation..."
echo "======================================"
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
  }"

echo ""
echo ""
echo "To check checkout status, run:"
echo "curl -X POST \"$SALEOR_URL\" -H \"Content-Type: application/json\" -H \"Authorization: JWT $SALEOR_TOKEN\" -d '{\"query\":\"query { checkout(token: \\\"$CHECKOUT_TOKEN\\\") { id lines { id variant { id product { id name } } quantity } } }\"}'"





