#!/bin/bash

# Script to test Saleor checkout line update
# Usage: ./test-checkout.sh [SALEOR_BACKEND_URL] [SALEOR_BACKEND_TOKEN] [CHECKOUT_TOKEN]

# Get environment variables or use provided arguments
SALEOR_URL="${1:-${SALEOR_BACKEND_URL}}"
SALEOR_TOKEN="${2:-${SALEOR_BACKEND_TOKEN}}"
CHECKOUT_TOKEN="${3:-aa608747-e15b-476b-96c3-07fb4dc7eb07}"

if [ -z "$SALEOR_URL" ] || [ -z "$SALEOR_TOKEN" ]; then
  echo "Error: SALEOR_BACKEND_URL and SALEOR_BACKEND_TOKEN must be set"
  echo "Usage: ./test-checkout.sh [SALEOR_BACKEND_URL] [SALEOR_BACKEND_TOKEN] [CHECKOUT_TOKEN]"
  exit 1
fi

echo "Testing Saleor Checkout Line Update"
echo "===================================="
echo "Saleor URL: $SALEOR_URL"
echo "Checkout Token: $CHECKOUT_TOKEN"
echo ""

# First, let's check if we can query the checkout
echo "1. Querying checkout by token..."
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "operationName": "CheckoutByToken",
    "variables": {
      "token": "'"$CHECKOUT_TOKEN"'"
    },
    "query": "query CheckoutByToken($token: UUID!) { checkout(token: $token) { id lines { id variant { id product { id name } } quantity } totalPrice { gross { amount currency } } } }"
  }' | jq '.'

echo ""
echo "2. Testing checkoutLinesUpdate mutation..."
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "operationName": "CheckoutLineUpdateInput",
    "variables": {
      "token": "'"$CHECKOUT_TOKEN"'",
      "lines": [
        {
          "quantity": 1,
          "variantId": "UHJvZHVjdFZhcmlhbnQ6MTg0NDE="
        }
      ]
    },
    "query": "mutation CheckoutLineUpdateInput($token: UUID, $lines: [CheckoutLineUpdateInput!]!) { checkoutLinesUpdate(token: $token, lines: $lines) { checkout { id lines { id variant { id product { id name } } quantity } totalPrice { gross { amount currency } } } errors { field message code } } }"
  }' | jq '.'

echo ""
echo "3. Checking checkout again after update..."
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "operationName": "CheckoutByToken",
    "variables": {
      "token": "'"$CHECKOUT_TOKEN"'"
    },
    "query": "query CheckoutByToken($token: UUID!) { checkout(token: $token) { id lines { id variant { id product { id name } } quantity } totalPrice { gross { amount currency } } } }"
  }' | jq '.'





