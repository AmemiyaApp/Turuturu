// src\app\api\stripe\products\route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Credit packages configuration
const CREDIT_PACKAGES = [
  {
    credits: 1,
    name: '1 Crédito',
    description: '1 música 100% personalizada',
    price: 9990, // R$ 99,90 in cents
  },
  {
    credits: 5,
    name: '5 Créditos',
    description: '5 músicas personalizadas com desconto',
    price: 39990, // R$ 399,90 in cents
  },
  {
    credits: 10,
    name: '10 Créditos',
    description: '10 músicas personalizadas - melhor valor',
    price: 69990, // R$ 699,90 in cents
  },
];

export async function GET() {
  try {
    // Fetch all products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Filter products that are credit packages
    const creditProducts = products.data.filter(product => 
      product.metadata?.type === 'credit_package'
    );

    // Format response
    const formattedProducts = creditProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      credits: parseInt(product.metadata?.credits || '0'),
      price: product.default_price 
        ? typeof product.default_price === 'string' 
          ? null 
          : product.default_price.unit_amount
        : null,
      priceId: typeof product.default_price === 'string' 
        ? product.default_price 
        : product.default_price?.id,
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const createdProducts = [];

    // Create products and prices for each credit package
    for (const pkg of CREDIT_PACKAGES) {
      // Create product
      const product = await stripe.products.create({
        name: `Turuturu - ${pkg.name}`,
        description: pkg.description,
        metadata: {
          type: 'credit_package',
          credits: pkg.credits.toString(),
        },
      });

      // Create price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.price,
        currency: 'brl',
        metadata: {
          credits: pkg.credits.toString(),
        },
      });

      // Update product to set default price
      await stripe.products.update(product.id, {
        default_price: price.id,
      });

      createdProducts.push({
        productId: product.id,
        priceId: price.id,
        credits: pkg.credits,
        name: pkg.name,
        price: pkg.price,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Products and prices created successfully',
      products: createdProducts,
    });

  } catch (error) {
    console.error('Error creating products:', error);
    return NextResponse.json(
      { error: 'Failed to create products' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Fetch all credit package products
    const products = await stripe.products.list({
      active: true,
    });

    const creditProducts = products.data.filter(product => 
      product.metadata?.type === 'credit_package'
    );

    // Archive products (Stripe doesn't allow deletion of products with prices)
    for (const product of creditProducts) {
      await stripe.products.update(product.id, {
        active: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Archived ${creditProducts.length} credit package products`,
      archivedCount: creditProducts.length,
    });

  } catch (error) {
    console.error('Error archiving products:', error);
    return NextResponse.json(
      { error: 'Failed to archive products' },
      { status: 500 }
    );
  }
}