#!/bin/bash

# Setup script for Stripe products
# This script creates the necessary products in Stripe for the credit packages

echo "Setting up Stripe products for Turuturu app..."

# Check if the products endpoint is accessible
echo "Creating Stripe products and prices..."

# Use curl to create the products
curl -X POST http://localhost:3000/api/stripe/products \
  -H "Content-Type: application/json" \
  -d '{}'

echo "Stripe products setup completed!"
echo "You can verify the products by visiting: http://localhost:3000/api/stripe/pricing"