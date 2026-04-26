#!/bin/bash

# Check stock availability for a specific channel
# Usage: ./check-stock-by-channel.sh [VARIANT_ID] [CHANNEL_SLUG]

SALEOR_URL="${SALEOR_BACKEND_URL:-https://api.inji.kz/graphql/}"
SALEOR_TOKEN="${SALEOR_BACKEND_TOKEN}"
VARIANT_ID="${1:-UHJvZHVjdFZhcmlhbnQ6MTg0NDE=}"
CHANNEL_SLUG="${2:-mobile}"

if [ -z "$SALEOR_TOKEN" ]; then
  echo "Error: SALEOR_BACKEND_TOKEN must be set"
  exit 1
fi

echo "Checking Stock Availability by Channel"
echo "======================================"
echo "Variant ID: $VARIANT_ID"
echo "Channel: $CHANNEL_SLUG"
echo ""

# Get channel ID first
echo "1. Getting channel information..."
CHANNEL_INFO=$(curl -s -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d "{
    \"query\": \"query { channel(slug: \\\"$CHANNEL_SLUG\\\") { id name slug currencyCode warehouses { id name slug } } }\"
  }")

echo "$CHANNEL_INFO" | python3 -m json.tool 2>/dev/null || echo "$CHANNEL_INFO"
echo ""

# Get variant with stock information
echo "2. Getting variant stock information..."
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d "{
    \"query\": \"query { productVariant(id: \\\"$VARIANT_ID\\\") { id name sku product { id name } stocks { id warehouse { id name slug } quantity quantityAllocated } } }\"
  }" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""

# Try to get available quantity for the channel
echo "3. Checking available quantity for channel '$CHANNEL_SLUG'..."
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d "{
    \"query\": \"query { productVariant(id: \\\"$VARIANT_ID\\\", channel: \\\"$CHANNEL_SLUG\\\") { id name quantityAvailable } }\"
  }" | python3 -m json.tool 2>/dev/null || cat





