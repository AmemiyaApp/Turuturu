// scripts/check-env.js
// Quick script to check if environment variables are properly set

console.log('🔍 Checking environment variables...\n');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'DIRECT_URL'
];

let hasErrors = false;

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  } else if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
    try {
      new URL(value);
      console.log(`✅ ${varName}: ${value}`);
    } catch {
      console.log(`❌ ${varName}: INVALID URL FORMAT - ${value}`);
      hasErrors = true;
    }
  } else {
    console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 20))}...`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  } else {
    console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 20))}...`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Some required environment variables are missing!');
  console.log('Please check your .env.local file and restart the server.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  console.log('You can now start the development server.');
}