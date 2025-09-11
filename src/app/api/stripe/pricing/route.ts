// src\app\api\stripe\pricing\route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function GET() {
  try {
    // Fetch all active products with their prices
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Filter and format credit packages
    const creditPackages = products.data
      .filter(product => product.metadata?.type === 'credit_package')
      .map(product => {
        const defaultPrice = product.default_price;
        const price = typeof defaultPrice === 'string' ? null : defaultPrice;
        
        return {
          productId: product.id,
          priceId: typeof defaultPrice === 'string' ? defaultPrice : price?.id,
          name: product.name,
          description: product.description,
          credits: parseInt(product.metadata?.credits || '0'),
          amount: price?.unit_amount || 0,
          currency: price?.currency || 'brl',
          formattedPrice: price?.unit_amount 
            ? `R$ ${(price.unit_amount / 100).toFixed(2).replace('.', ',')}`
            : 'N/A',
        };
      })
      .sort((a, b) => a.credits - b.credits); // Sort by credits ascending

    // Add savings calculation for packages with more than 1 credit
    const packagesWithSavings = creditPackages.map((pkg) => {
      const basePackage = creditPackages[0]; // 1 credit package
      const basePrice = basePackage?.amount || 0;
      
      if (pkg.credits > 1 && basePrice > 0) {
        const totalIfBuyingSeparately = basePrice * pkg.credits;
        const savings = totalIfBuyingSeparately - pkg.amount;
        const savingsPercentage = Math.round((savings / totalIfBuyingSeparately) * 100);
        
        return {
          ...pkg,
          savings: {
            amount: savings,
            percentage: savingsPercentage,
            formattedSavings: `R$ ${(savings / 100).toFixed(2).replace('.', ',')}`,
            originalPrice: `R$ ${(totalIfBuyingSeparately / 100).toFixed(2).replace('.', ',')}`,
          },
        };
      }
      
      return pkg;
    });

    return NextResponse.json({
      success: true,
      packages: packagesWithSavings,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pricing information',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}