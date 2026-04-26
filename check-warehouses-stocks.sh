#!/bin/bash

# Script to check warehouses and stock levels in Saleor
# Usage: ./check-warehouses-stocks.sh [VARIANT_ID]

SALEOR_URL="${SALEOR_BACKEND_URL:-https://api.inji.kz/graphql/}"
SALEOR_TOKEN="${SALEOR_BACKEND_TOKEN}"
VARIANT_ID="${1:-UHJvZHVjdFZhcmlhbnQ6MTg0NDE=}"

if [ -z "$SALEOR_TOKEN" ]; then
  echo "Error: SALEOR_BACKEND_TOKEN must be set"
  echo "Usage: SALEOR_BACKEND_TOKEN='...' ./check-warehouses-stocks.sh [VARIANT_ID]"
  exit 1
fi

echo "Checking Warehouses and Stock Levels"
echo "===================================="
echo "Saleor URL: $SALEOR_URL"
echo "Variant ID: $VARIANT_ID"
echo ""

# 1. Get list of warehouses
echo "1. Fetching warehouses..."
echo "------------------------"
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "query": "query { warehouses(first: 100) { edges { node { id name slug email address { streetAddress1 city postalCode country { code } } } } } }"
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""

# 2. Get stock information for the variant
echo "2. Fetching stock information for variant..."
echo "---------------------------------------------"
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d "{
    \"query\": \"query { productVariant(id: \\\"$VARIANT_ID\\\") { id name sku product { id name } stocks { id warehouse { id name slug } quantity quantityAllocated } } }\"
  }" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""

# 3. Get all stock entries for the variant
echo "3. Fetching all stock entries..."
echo "----------------------------------"
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d "{
    \"query\": \"query { productVariant(id: \\\"$VARIANT_ID\\\") { id stocks { id warehouse { id name slug address { streetAddress1 city country { code } } } quantity quantityAllocated } } }\"
  }" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""

# 4. Get channel information (to see which warehouses are assigned to channels)
echo "4. Fetching channels and their warehouse assignments..."
echo "-------------------------------------------------------"
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "query": "query { channels(first: 100) { edges { node { id name slug currencyCode warehouses { id name slug } } } } }"
  }' | python3 -m json.tool 2>/dev/null || cat





