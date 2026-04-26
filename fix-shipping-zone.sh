#!/bin/bash

# Script to add Kazakhstan (KZ) to the shipping zone
# This will fix the issue where products show 0 available for KZ addresses

SALEOR_URL="${SALEOR_BACKEND_URL:-https://api.inji.kz/graphql/}"
SALEOR_TOKEN="${SALEOR_BACKEND_TOKEN}"
SHIPPING_ZONE_ID="U2hpcHBpbmdab25lOjE="  # Default shipping zone

if [ -z "$SALEOR_TOKEN" ]; then
  echo "Error: SALEOR_BACKEND_TOKEN must be set"
  exit 1
fi

echo "Adding Kazakhstan (KZ) to shipping zone..."
echo "=========================================="
echo "Shipping Zone ID: $SHIPPING_ZONE_ID"
echo ""

# First, get current countries in the shipping zone
echo "1. Getting current shipping zone configuration..."
CURRENT_ZONE=$(curl -s -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "query": "query { shippingZone(id: \"'$SHIPPING_ZONE_ID'\") { id name countries { code } } }"
  }')

echo "$CURRENT_ZONE" | python3 -m json.tool 2>/dev/null || echo "$CURRENT_ZONE"
echo ""

# Update shipping zone to include KZ
echo "2. Updating shipping zone to include Kazakhstan (KZ)..."
curl -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "query": "mutation ShippingZoneUpdate($id: ID!, $input: ShippingZoneUpdateInput!) { shippingZoneUpdate(id: $id, input: $input) { shippingZone { id name countries { code } } errors { field message code } } }",
    "variables": {
      "id": "'$SHIPPING_ZONE_ID'",
      "input": {
        "countries": ["US", "KZ"]
      }
    }
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""
echo "3. Verifying update..."
curl -s -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "query": "query { shippingZone(id: \"'$SHIPPING_ZONE_ID'\") { id name countries { code } warehouses { id name } } }"
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo ""
echo "4. Testing product availability for KZ address..."
curl -s -X POST "$SALEOR_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT $SALEOR_TOKEN" \
  -d '{
    "query": "query { productVariant(id: \"UHJvZHVjdFZhcmlhbnQ6MTg0NDE=\", channel: \"mobile\") { id name quantityAvailable quantityAvailableWithAddress: quantityAvailable(address: { country: KZ, city: \"УРАЛЬСК\" }) } }"
  }' | python3 -m json.tool 2>/dev/null || cat





